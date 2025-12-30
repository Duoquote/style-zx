import type { Plugin, HmrContext, ResolvedConfig } from 'vite';
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

function processFile(code: string, id: string, shouldInjectCss: boolean): { css: string, cssRules: Map<string, string>, code: string, map: any, hasZx: boolean } | null {
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
    const cssRules = new Map<string, string>();

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
                    cssRules.set(className, css);

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
                            s.overwrite(classAttr.value.expression.start, classAttr.value.expression.end, `[${originalExp}, "${className}"].filter(Boolean).join(" ")`);
                        }
                    } else {
                        s.appendLeft(zxAttr.start!, ` className="${className}" `);
                    }
                }
            }
        }
    });

    if (hasZx) {
        if (shouldInjectCss) {
            s.prepend(`import '${id}.style-zx.css';\n`);
        }
        return {
            code: s.toString(),
            map: s.generateMap({ hires: true }),
            css: generatedCss,
            cssRules,
            hasZx: true
        };
    }

    return null;
}

export default function styleZx(): Plugin[] {
    const cssMap = new Map<string, string>();
    let config: ResolvedConfig;
    // Map of className -> CSS rule for dead code elimination
    const cssRulesMap = new Map<string, string>();

    return [
        {
            name: 'vite-plugin-style-zx',
            enforce: 'pre',

            configResolved(resolvedConfig) {
                config = resolvedConfig;
            },

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

                const shouldInjectCss = config.command === 'serve';
                const result = processFile(code, id, shouldInjectCss);
                if (result && result.hasZx) {
                    cssMap.set(id, result.css);
                    if (config.command === 'build') {
                        // Store each CSS rule by its class name for later filtering
                        for (const [className, cssRule] of result.cssRules) {
                            cssRulesMap.set(className, cssRule);
                        }
                    }
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
                const result = processFile(code, file, true);

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
        },
        {
            name: 'vite-plugin-style-zx-post',
            enforce: 'post',
            generateBundle(_options, bundle) {
                if (config.command === 'build' && cssRulesMap.size > 0) {
                    // Collect all JS chunk contents to scan for used classes
                    let allJsContent = '';
                    for (const file of Object.values(bundle)) {
                        if (file.type === 'chunk') {
                            allJsContent += file.code;
                        }
                    }

                    // Filter CSS rules to only include classes that appear in the final bundle
                    const usedCssRules: string[] = [];
                    for (const [className, cssRule] of cssRulesMap) {
                        // Check if the class name appears in any JS chunk
                        if (allJsContent.includes(className)) {
                            usedCssRules.push(cssRule);
                        }
                    }

                    if (usedCssRules.length === 0) {
                        return; // No CSS to emit
                    }

                    const refId = this.emitFile({
                        type: 'asset',
                        name: 'style-zx.css',
                        source: usedCssRules.join('\n')
                    });

                    const fileName = this.getFileName(refId);
                    const base = config.base || '/';

                    for (const file of Object.values(bundle)) {
                        if (file.type === 'asset' && file.fileName.endsWith('.html')) {
                            const source = file.source as string;
                            if (source.includes('</head>')) {
                                file.source = source.replace(
                                    '</head>',
                                    `<link rel="stylesheet" href="${base}${fileName}">\n</head>`
                                );
                            }
                        }
                    }
                }
            }
        }
    ];
}
