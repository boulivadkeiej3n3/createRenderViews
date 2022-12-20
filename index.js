/***********************************/
const Puppeteer        = require("puppeteer");
const randomUserAgent  = require("random-useragent");
const Mongoose         = require("mongoose");
const PingServer       = `https://host-router.onrender.com/`;
const ServersDB = Mongoose.model(`RenderServers`, new Mongoose.Schema({url:String}));
const RenderAccountsDB = Mongoose.model(`renderaccounts`, new Mongoose.Schema({url:String}));
const AccountPassword  = `123RENDER.com`;
const PuppeteerOptions = {headless:true, args:["--no-sandbox"]}
const PublicRepoID     = `https://github.com/boulivadkeiej3n3/puppeteerworker-1`;
let RenderBrowser;
let RenderPage;

const CommonRenderAccountPassword = `123RENDER.com`;
const asyncSetTimeout = async(duration)=>{await new Promise((resolve)=> setTimeout(resolve, duration))}

Mongoose.connect(`mongodb+srv://maximous:123MONGODB.com@m001.cmsqx.mongodb.net/?retryWrites=true&w=majority`).then((connection)=>{
connection ? console.log(`Database Connected!`): console.log(`Error Occured during connection to database`)})
/********
 * 1 - connect renderAccounts database
 * DO
 *  2 - find the index that has less than 750 accounts in RenderAccounts Database
 *  3 - login to this account
 *   DO
 *    4 - create a new services
 *    5 - update the render accounts count
 *   REPEAT
 * 6 - when the accounts has already reached 750, log out
 * REPEAT 
 */


async function elementExists(page,selectorString){
    console.log(selectorString)
return await page.evaluate(()=>{
   return (document.querySelector(selectorString))?true:false
},selectorString)
}

function generateRandomName(){
const characters = [`A`,`B`,`C`,`D`,`E`,`F`,`G`,`H`,`I`,`J`,`K`,`L`,`M`,`N`,`P`,`Q`,`R`,`S`,`T`,`U`,`V`,`X`,`Z`,
                    `a`,`b`,`c`,`d`,`e`,`f`,`g`,`h`,`i`,`j`,`k`,`l`,`m`,`n`,`p`,`q`,`r`,`s`,`t`,`u`,`v`,`x`,`z`,
                     `1`,`2`,`3`,`4`,`5`,`6`,`7`,`8`,`9`];
    let hash = "";
for (let index =0; index <24; index++){
hash+=characters[Math.floor(Math.random() *(characters.length - 0 +1))];
}
return hash;

}
async function remixProject(account){
// If it didnt login in and the login page still exists: login again:
if(await RenderPage.$(`[name="email"]`)){await LoginAccount(account)}

    console.log(`[PUPPETEER INFO]: Project started remixing..`)
//PATH FOR CREATING A NEW SERVICE:https://dashboard.render.com/select-repo?type=web
//Public repo input field: input[data-testid="public-git-repo-url-input"]
//Public repo submit field: div.z-10  button
await RenderPage.goto(`https://dashboard.render.com/select-repo?type=web`);
await (await RenderPage.waitForSelector(`input[data-testid="public-git-repo-url-input"]`)).type(PublicRepoID);
await (await RenderPage.waitForSelector(`div.z-10 button`)).click();
console.log(`[PUPPETEER INFO]:"Submit" Project creation started..`)

//Service Name input field: input#serviceName
//button[type="submit"]
await asyncSetTimeout(10000);
const serviceName = generateRandomName()
await( await RenderPage.waitForSelector(`input`)).type(serviceName);
// Adding environment variables:
await (await RenderPage.waitForSelector(`button.css-ussx8e`)).click();
await (await RenderPage.waitForSelector(`button.css-1mp77y2`)).click();
await (await RenderPage.waitForSelector(`[name="envVars.0.key"]`)).type("DOMAIN");
await (await RenderPage.waitForSelector(`[name="envVars.0.value"]`)).type(serviceName+".onrender.com")
///
await asyncSetTimeout(3000);
await (await RenderPage.waitForSelector(`button[type="submit"]`)).click();
console.log(`[PUPPETEER INFO]: Project Initialized..`)

//wait for logs: div.xterm-accessibility-tree
await asyncSetTimeout(10000);
await RenderPage.waitForSelector(`div.xterm-accessibility-tree`);
console.log(`[PUPPETEER INFO]: Logs Have Been found..`)
await asyncSetTimeout(20000);
console.log(`[PUPPETEER INFO]: Remixing endded..`)

//Add the newly created service url to the database! And return the url of the project to be pinged 
const ProjectURL = (await RenderPage.evaluate(()=> document.querySelector(`div.h4.font-weight-normal a`).textContent))
await (new ServersDB({url:ProjectURL})).save()
return ProjectURL;
}

async function LoginAccount(accontEmail){
  
  await (await RenderPage.waitForSelector(`[name="email"]`)).type(accontEmail);
  await (await RenderPage.waitForSelector(`[name="password"]`)).type(CommonRenderAccountPassword);
  await (await RenderPage.waitForSelector(`[type="submit"]`)).click();
  
  return 0;
}
async function main(){
 /*     RenderAccountsDB.findOne({account:"aashay.sina@falltrack.net"}).then((doc)=>{
      doc._doc.accountCounts++;
      doc.markModified("accountCounts")
      doc.save().then((doc)=> console.log(doc));   
    }) */

	/*********************************************/
    // Find the accounts that has less than 750 accounts:
    while(true){
        try{
            RenderBrowser =(await Puppeteer.launch(PuppeteerOptions));
            RenderPage    =(await RenderBrowser.pages())[0];
            RenderPage.setUserAgent(randomUserAgent.getRandom())
            // Block images and css and fonts from downloading for speed increase
             await RenderPage.setRequestInterception(true);
             RenderPage.on('request', (req) => {
              if(/*req.resourceType() == 'stylesheet' ||*/ req.resourceType() == 'font' || req.resourceType() == 'image'){
              req.abort();
              }else{
                  req.continue();
              }
              
             })}catch(e){console.log(`[ERROR]:  Error while creating a new account\n${e.message}`)}
            
    RenderAccountsDB.findOne({accountCounts: {$lt:740}},{_id:0},async (err,accountDoc)=>{
        //if there's a no empty account left, return
       // if(err){console.log(err.message); RenderBrowser.close(); return} 
        console.dir(accountDoc._doc.account);

        await RenderPage.goto(`https://dashboard.render.com/signin`);

        await LoginAccount(accountDoc._doc.account);
        await asyncSetTimeout(5000)
        //Create 30 services and return then logout:
          for (let index=0; index <5; index++){
            try{
        await remixProject(accountDoc._doc.account)
       await  RenderAccountsDB.findOne({account:"aashay.sina@falltrack.net"}).then(async (doc)=>{
       doc._doc.accountCounts++;
        doc.markModified("accountCounts")
       await  doc.save()
       console.log(doc);   
    })
            }catch(e){console.log(`EROR REMIXING: ${e.message}`);}
        }

     })
     //RenderBrowser.close()
     return
    }
   
}main();

