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

// Global registry
const styleMap = new Map<string, string>(); // hash -> css
const fileStyleUsage = new Map<string, Set<string>>(); // fileId -> Set<hash>

function processFile(code: string, id: string): { code: string, map: any, hasZx: boolean } | null {
    if (!code.includes('zx={')) {
        // If the file no longer has zx, we should clear its usage
        if (fileStyleUsage.has(id)) {
            fileStyleUsage.delete(id);
            return { code, map: null, hasZx: false }; // Return hasZx: false to trigger updates if needed
        }
        return null;
    }

    const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
    });

    const s = new MagicString(code);
    let hasZx = false;
    const usedHashes = new Set<string>();

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

                    const styleHash = hash(JSON.stringify(styleObj));
                    const className = `zx-${styleHash}`;

                    // Add to global registry if not exists
                    if (!styleMap.has(styleHash)) {
                        const css = compileStyle(styleObj, className);
                        styleMap.set(styleHash, css);
                    }
                    usedHashes.add(styleHash);

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

    // Update usage for this file
    if (hasZx) {
        fileStyleUsage.set(id, usedHashes);
        s.prepend(`import 'virtual:style-zx.css';\n`);
        return {
            code: s.toString(),
            map: s.generateMap({ hires: true }),
            hasZx: true
        };
    } else {
        fileStyleUsage.delete(id);
    }

    return null;
}

export default function styleZx(): Plugin {
    const virtualModuleId = 'virtual:style-zx.css';
    const resolvedVirtualModuleId = '\0' + virtualModuleId;

    return {
        name: 'vite-plugin-style-zx',
        enforce: 'pre',

        resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId;
            }
            return null;
        },

        load(id) {
            if (id === resolvedVirtualModuleId) {
                // Rebuild CSS from all used styles
                // We could optimize this by ref-counting, but for now iterating unique hashes is fine
                const allUsedHashes = new Set<string>();
                for (const hashes of fileStyleUsage.values()) {
                    hashes.forEach(h => allUsedHashes.add(h));
                }

                let css = '';
                allUsedHashes.forEach(h => {
                    if (styleMap.has(h)) {
                        css += styleMap.get(h) + '\n';
                    }
                });
                return css;
            }
            return null;
        },

        transform(code, id) {
            if (!/\.(t|j)sx?$/.test(id)) {
                return null;
            }

            const result = processFile(code, id);
            if (result && result.hasZx) {
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
            processFile(code, file);

            // Regardless of whether result hasZx, we might need to update the CSS
            // because styles might have been removed.

            const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
            if (mod) {
                // Invalidate the virtual module so it reloads
                server.moduleGraph.invalidateModule(mod);

                // If the file itself changed, we return its modules + the virtual CSS module
                // This ensures the browser reloads the CSS
                return [...modules, mod];
            }
        }
    };
}
