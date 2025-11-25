import { Glob} from "bun";
import path from "node:path";
import * as fs from "node:fs";

export default function AppSyncApi(){

  const appRoots = new Glob("packages/*/Resolvers").scanSync({
    cwd:process.cwd()
  });

  console.log("Detected Resolver Roots");

  const dataSources :Record<string,sst.aws.AppSyncDataSourceArgs>= {};
  const resolvers :Record < string, {name:string,dataSource:string}>= {};

  for (const root of appRoots){

    fs.readdirSync(root).forEach(typeName=>{
      const typeDir = path.join(root, typeName);

      if (!fs.statSync(typeDir).isDirectory()) return;

      fs.readdirSync(typeDir).forEach(file=>{
        if (!file.endsWith(".ts") && !file.endsWith(".js")) return;

        const fieldName = file.replace(/\.(ts|js)$/, "");

        const resolverId = `${typeName}.${fieldName}`;

        const handlerPath = path.join(typeDir, file);

        const fn = new sst.aws.Function(`${resolverId}Fn`, {
          handler: handlerPath
        });

        dataSources[resolverId] = {
          name: "function",
          lambda: fn.name
        };


        resolvers[resolverId]={
          name:fieldName,
          dataSource:resolverId
        }

      })

    })

  }

  const api = new sst.aws.AppSync("TestAppSyncApi", {
    schema: "../schema.graphql",
  });

  for(const key of Object.keys(dataSources)){
    api.addDataSource(dataSources[key]);

    for(const resKey of Object.keys(resolvers)){
      api.addResolver(resolvers[resKey].name,{
        dataSource:resolvers[resKey].dataSource
      })
    }
  }


  return api
}
