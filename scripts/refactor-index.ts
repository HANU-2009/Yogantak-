import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFileAtPath('./server/index.ts');
const sourceFile = project.getSourceFileOrThrow('./server/index.ts');

console.log('Finding all route handlers...');

// 1. Make all app.get, app.post, etc. callback functions async
const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
for (const callExpr of callExpressions) {
  const expr = callExpr.getExpression();
  if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
    const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression);
    const text = propAccess.getText();
    if (text === 'app.get' || text === 'app.post' || text === 'app.put' || text === 'app.delete') {
      // The last argument is usually the route handler
      const args = callExpr.getArguments();
      const handler = args[args.length - 1];
      if (handler && (handler.getKind() === SyntaxKind.ArrowFunction || handler.getKind() === SyntaxKind.FunctionExpression)) {
        const func = handler.asKindOrThrow(SyntaxKind.ArrowFunction) || handler.asKindOrThrow(SyntaxKind.FunctionExpression);
        if (!func.isAsync()) {
          func.setIsAsync(true);
        }
      }
    }
  }
}

console.log('Making syncUserToDB and createDefaultProducts async...');
// Make specific helper functions async
for (const funcName of ['syncUserToDB', 'createDefaultProducts']) {
  const func = sourceFile.getFunction(funcName);
  if (func && !func.isAsync()) {
    func.setIsAsync(true);
  }
}

// Any call to syncUserToDB should be awaited
for (const callExpr of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
  const expr = callExpr.getExpression();
  if (expr.getText() === 'syncUserToDB') {
    // Wrap with await if not already awaited
    const parent = callExpr.getParent();
    if (parent && parent.getKind() !== SyntaxKind.AwaitExpression) {
      callExpr.replaceWithText(`await ${callExpr.getText()}`);
    }
  }
}

console.log('Transforming db.prepare...');
// 2. Transform `db.prepare(...).get(...)`, `.all(...)`, `.run(...)` to await dbProxy(...)
for (const callExpr of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
  const expr = callExpr.getExpression();
  if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
    const propAccess = expr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
    if (propAccess.getExpression().getText().endsWith('db.prepare')) {
      const methodName = propAccess.getName(); // 'get', 'all', or 'run'
      
      // The db.prepare('...') call itself
      const prepareCall = propAccess.getExpression().asKindOrThrow(SyntaxKind.CallExpression);
      
      // It's already db.prepare('sql') -> db.prepare('sql').get(args)
      // Change `db.prepare(X)` to `dbProxy.prepare(X)`
      // Actually wait, wait... I'll just change the text of the whole call.
      
      const sqlArg = prepareCall.getArguments()[0].getText();
      const methodArgs = callExpr.getArguments().map(a => a.getText());
      
      let replacement = `await dbProxy.prepare(${sqlArg}).${methodName}(${methodArgs.join(', ')})`;
      
      const parent = callExpr.getParent();
      if (parent && parent.getKind() !== SyntaxKind.AwaitExpression) {
        callExpr.replaceWithText(replacement);
      }
    }
  }
}

console.log('Transforming db.prepare standalone assignments...');
// 3. Transform standalone `const query = db.prepare(...)` 
// and `query.get(...)`
for (const varDecl of sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
  const init = varDecl.getInitializer();
  if (init && init.getKind() === SyntaxKind.CallExpression) {
    const callExpr = init.asKindOrThrow(SyntaxKind.CallExpression);
    const expr = callExpr.getExpression();
    if (expr.getText() === 'db.prepare') {
      // Change to dbProxy.prepare
      expr.replaceWithText('dbProxy.prepare');
    }
  }
}

for (const callExpr of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
  const expr = callExpr.getExpression();
  if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
    const propAccess = expr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
    const name = propAccess.getName();
    if (name === 'get' || name === 'all' || name === 'run') {
      const obj = propAccess.getExpression().getText();
      // Heuristic: if it's called 'query' or 'insert' or 'update' or 'del' or 'selectQuery'
      if (['query', 'insert', 'update', 'del', 'selectQuery', 'cartQuery', 'userQuery'].includes(obj) || obj.endsWith('Query') || obj === 'prod') {
        const parent = callExpr.getParent();
        if (parent && parent.getKind() !== SyntaxKind.AwaitExpression) {
          callExpr.replaceWithText(`await ${callExpr.getText()}`);
        }
      }
    }
  }
}

// 4. Inject dbProxy at the top
const dbImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === './db.js');
if (dbImport) {
  sourceFile.insertStatements(dbImport.getChildIndex() + 1, `
// Database proxy to translate SQLite prepare API to Neon Async API
const dbProxy = {
  prepare: (sql: string) => {
    let count = 1;
    const pgSql = sql.replace(/\\?/g, () => '$' + (count++));
    return {
      get: async (...args: any[]) => {
        const res = await db.query(pgSql, args.flat());
        return res.rows[0];
      },
      all: async (...args: any[]) => {
        const res = await db.query(pgSql, args.flat());
        return res.rows;
      },
      run: async (...args: any[]) => {
        const res = await db.query(pgSql, args.flat());
        return res;
      }
    };
  }
};
`);
}

sourceFile.saveSync();
console.log('Refactor complete!');
