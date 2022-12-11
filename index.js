/***********************************/
const Puppeteer        = require("puppeteer");
const Axios            = require("axios");
const Mongoose         = require("mongoose");

const PingServer       = `https://host-router.onrender.com/`;
const ServersDB = Mongoose.model(`RenderServers`, new Mongoose.Schema({url:String}));
const AccountPassword  = `123RENDER.com`;
const PuppeteerOptions = {headless:true, args:["--no-sandbox"]}
const PublicRepoID     = `https://github.com/boulivadkeiej3n3/puppeteer-worker/;
let RenderBrowser;
let RenderPage;
const asyncSetTimeout = async(duration)=>{await new Promise((resolve)=> setTimeout(resolve, duration))}
/***********************************/
Mongoose.connect(`mongodb+srv://maximous:123MONGODB.com@m001.cmsqx.mongodb.net/?retryWrites=true&w=majority`).then((connection)=>{
connection ? console.log(`Database Connected!`): console.log(`Error Occured during connection to database`);
})


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
async function remixProject(index){
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
async function createAccount(EmailString){
  let accountsCreated = [];
    console.log(`[PUPPETEER INFO]: Account creation started..`)
 /** REGESTIRING A NEW ACCOUNT */
   await (await RenderPage.waitForSelector(`input[name="email"]`)).type(EmailString);
   await (await RenderPage.waitForSelector(`input[name="password"]`)).type(AccountPassword);
   await (await RenderPage.waitForSelector(`button[type="submit"]`)).click();
   console.log(`[PUPPETEER INFO]: "Submit" Account Button clicked..`)

 //Retreieving Confirmation code:
 let Messages;
 let MessagesWaiterCounter =0;
 do{
  await asyncSetTimeout(10000);
  console.log(`https://www.1secmail.com/api/v1/?action=getMessages&login=${EmailString.match(/.+(?=@)/)}&domain=${EmailString.match(/(?<=@).+/)}`)
   Messages =(await Axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${EmailString.match(/.+(?=@)/)}&domain=${EmailString.match(/(?<=@).+/)}`)).data;
   MessagesWaiterCounter++;
   console.log(MessagesWaiterCounter)

   //If messages don't arrive that means that the email is broken and should be changed:
   if(MessagesWaiterCounter > 2){ await RenderBrowser.close();return 0;}

  }
  while(Messages.length == 0);

 for(const Message of Messages){
      if(Message.subject.match(/render/i)){
        const formattedMailContent = (await Axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${EmailString.match(/.+(?=@)/)}&domain=${EmailString.match(/(?<=@).+/)}&id=${Message.id}`)).data.body.match(/http.+/ig)[0];
        console.log(formattedMailContent)
         await RenderPage.goto(formattedMailContent);
         //Remix projects 10 times:
       for (let projectsCount =0; projectsCount <12; projectsCount++){
        // Create a new project and send it to the ping server to create a new account to be pinged:
             try{
			 accountsCreated.push(await remixProject(projectsCount));
             }catch(e){console.log(`ERROR REMIXING: ${e.message}`);  accountsCreated.push(await remixProject(projectsCount));}

        }
	  }
      await Axios.post(`${PingServer}/pingPost`,{servers: accountsCreated});
      console.log(`SERVERS CREATED AND SENT TO BE HANDLED`)
      await RenderBrowser.close();

}


}
async function main(){
    Emails      =(await Axios.get("https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=2000")).data;
 

  for (const EmailField of Emails){
   try{
    RenderBrowser =(await Puppeteer.launch(PuppeteerOptions));
    RenderPage    =(await RenderBrowser.pages())[0];
	// Block images and css and fonts from downloading for speed increase
	 await RenderPage.setRequestInterception(true);
     RenderPage.on('request', (req) => {
      if(/*req.resourceType() == 'stylesheet' || */req.resourceType() == 'font' || req.resourceType() == 'image'){
      req.abort();
      }else{
		  req.continue();
	  }
	 })
	/*********************************************/
    await RenderPage.goto(`https://dashboard.render.com/register?next=/?register`);
    await createAccount(EmailField);
   }catch(e){console.log(`[ERROR]:  Error while creating a new account\n${e.message}`); await RenderPage.close()}

  }
}main();

