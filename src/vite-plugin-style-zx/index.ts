import type { Plugin, HmrContext } from 'vite';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import MagicString from 'magic-string';
import { compileStyle } from './compiler';
import crypto from 'crypto';

function hash(str: string) {
    return crypto.createHash('md5').update(str).digest('hex').slice(0, 8);
}

function evaluateAstNode(node: t.Node): any {
    if (t.isStringLiteral(node)) return node.value;
    if (t.isNumericLiteral(node)) return node.value;
    if (t.isBooleanLiteral(node)) return node.value;
    if (t.isNullLiteral(node)) return null;
    if (t.isUnaryExpression(node) && node.operator === '-' && t.isNumericLiteral(node.argument)) {
        return -node.argument.value;
    }

    if (t.isObjectExpression(node)) {
        const obj: any = {};
        node.properties.forEach(prop => {
            if (t.isObjectProperty(prop)) {
                const key = t.isIdentifier(prop.key) ? prop.key.name : t.isStringLiteral(prop.key) ? prop.key.value : null;
                if (!key) {
                    throw new Error(`Unsupported key type in zx prop: ${prop.key.type}`);
                }
                obj[key] = evaluateAstNode(prop.value);
            } else {
                throw new Error(`Unsupported property type in zx prop: ${prop.type}. Only static object properties are allowed.`);
            }
        });
        return obj;
    }

    throw new Error(`Dynamic expressions are not allowed in zx prop. Found: ${node.type}. Use 'style' prop for dynamic values.`);
}

function processFile(code: string, id: string): { css: string, code: string, map: any, hasZx: boolean } | null {
    if (!code.includes('zx={')) {
        return null;
    }

    const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
    });

    const s = new MagicString(code);
    let hasZx = false;
    let generatedCss = '';

    // Handle Babel interop
    const _traverse = (traverse as any).default || traverse;

    _traverse(ast, {
        JSXOpeningElement(path: any) {
            const zxAttr = path.node.attributes.find(
                (attr: any) => t.isJSXAttribute(attr) && attr.name.name === 'zx'
            ) as t.JSXAttribute;

            if (zxAttr) {
                hasZx = true;

                if (t.isJSXExpressionContainer(zxAttr.value) && t.isObjectExpression(zxAttr.value.expression)) {
                    let styleObj: any = {};

                    try {
                        styleObj = evaluateAstNode(zxAttr.value.expression);
                    } catch (e: any) {
                        throw new Error(`Error parsing zx prop in ${id}: ${e.message}`);
                    }

                    const className = `zx-${hash(JSON.stringify(styleObj))}`;
                    const css = compileStyle(styleObj, className);
                    generatedCss += css + '\n';

                    const classAttr = path.node.attributes.find(
                        (attr: any) => t.isJSXAttribute(attr) && attr.name.name === 'className'
                    ) as t.JSXAttribute;

                    if (zxAttr.start != null && zxAttr.end != null) {
                        s.remove(zxAttr.start, zxAttr.end);
                    }

                    if (classAttr) {
                        if (t.isStringLiteral(classAttr.value) && classAttr.value.start && classAttr.value.end) {
                            s.overwrite(classAttr.value.start, classAttr.value.end, `"${classAttr.value.value} ${className}"`);
                        } else if (t.isJSXExpressionContainer(classAttr.value) && classAttr.value.expression.start && classAttr.value.expression.end) {
                            const originalExp = code.slice(classAttr.value.expression.start, classAttr.value.expression.end);
                            s.overwrite(classAttr.value.expression.start, classAttr.value.expression.end, `\`\${${originalExp}} ${className}\``);
                        }
                    } else {
                        s.appendLeft(zxAttr.start!, ` className="${className}" `);
                    }
                }
            }
        }
    });

    if (hasZx) {
        s.prepend(`import '${id}.style-zx.css';\n`);
        return {
            code: s.toString(),
            map: s.generateMap({ hires: true }),
            css: generatedCss,
            hasZx: true
        };
    }

    return null;
}

export default function styleZx(): Plugin {
    const cssMap = new Map<string, string>();

    return {
        name: 'vite-plugin-style-zx',
        enforce: 'pre',

        resolveId(source) {
            if (source.endsWith('.style-zx.css')) {
                return source;
            }
            return null;
        },

        load(id) {
            if (id.endsWith('.style-zx.css')) {
                const originalFile = id.replace('.style-zx.css', '');
                return cssMap.get(originalFile) || '';
            }
            return null;
        },

        transform(code, id) {
            if (!/\.(t|j)sx?$/.test(id)) {
                return null;
            }

            const result = processFile(code, id);
            if (result && result.hasZx) {
                cssMap.set(id, result.css);
                return {
                    code: result.code,
                    map: result.map,
                };
            }
            return null;
        },

        async handleHotUpdate({ file, modules, read, server }: HmrContext) {
            if (!/\.(t|j)sx?$/.test(file)) {
                return;
            }

            const code = await read();
            const result = processFile(code, file);

            if (result && result.hasZx) {
                cssMap.set(file, result.css);

                // Find the virtual CSS module and invalidate it
                const virtualId = `${file}.style-zx.css`;
                const cssModule = server.moduleGraph.getModuleById(virtualId);

                if (cssModule) {
                    // Return both the original module(s) and the CSS module
                    // This tells Vite that the CSS module has also changed
                    return [...modules, cssModule];
                }
            }
        }
    };
}
