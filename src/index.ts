import express, {json, Request, Response, Router} from "express";
import basicAuth from "express-basic-auth";
import configured from "configuredjs";
import {HttpPost} from "http-client-methods";

const config = configured({
    path: "config.json", writeMissing: true, defaultConfig: {
        port: 8080,
        password: ""
    }
})

if (config.password === "") {
    console.log("Password must be set in config file.");
    process.exit(1)
}

const app = express();
export let securedRoutes = Router()
securedRoutes.use(basicAuth({
    users: {admin: config.password},
    challenge: true
}));

app.use(json({limit: '50mb'}));

async function startStudy(req:Request, res:Response){
    if (!req?.body?.study_id || !req?.body?.participant_id) {
        res.writeHead(400);
        res.end("Missing data");
        return;
    }

    console.log("Starting: "+req.body.study_id);
    let resp = await HttpPost("https://internal-api.prolific.co/api/v1/submissions/", req.body, {authorization:req.headers.authorization}, true);
    res.writeHead(resp.status, {"content-type": "application/json"});
    res.write(JSON.stringify(await resp.json()));
    res.end();
}

app.post('/start_param', async function (req: Request, res: Response) {
    if(!req.url.endsWith("?"+config.password)){
        res.writeHead(401);
        res.end("Unauthorised");
        return;
    }

    await startStudy(req, res);
})

app.get('/', function (req: Request, res: Response) {
    res.send('Hello World');
})

securedRoutes.post('/start', async function (req: Request, res: Response) {
    await startStudy(req, res);
})

app.listen(config.port)