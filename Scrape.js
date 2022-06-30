const puppeteer = require('puppeteer');
const axios = require('axios')
const fs = require('fs');

const loginData = {
    'log': 'matheuslasserre3',
    'pwd': 'Lasserre',
    'g-recaptcha-response': '03AGdBq26Gx3WatKSOUTMYgx1UC87H6oxsrOazlnYbGgrQ2PaWK5JZMUKBXSEWICvvuGQDx5acE0al6GRk8YwlTRPpkYzgYQaCqnTL5N_WVNGgN45dfdNSiXcAbv96XBnZFDEp1gtIYSOpF_1ACMLVgHLh7XYzVI24vWE2RceyXcLqZoBIxL2K7rrhbCC6X6sJvQaXRXlAZb088y6utF_1a5vnIOcmSmcxLcESbkwdrAxbpsN4uvRjYpNRJP3pmqiFIy- IkKFufcttkE4GFTssUi9SsKG_Mtiz6d3DRcXFmy9GMeZDgZGeMAfrSi4czk41Vtp0K0FK0T3fR27nWsY8YKaXJ5ttCs5O1Z2rNVD1jg2JSmJkqNS0TfLA1npdxpsymk24flNpxOkxizOhrrtSDtYJCklq0HwbyL12H0 - lkC5iCHRMGOrqJ80uisHdk9J2YAjFPgRn8hrWvcZ3dD6YA82iwC9 - yCaP2MD9KyZCCtC6LHIZRP6olllsNepqIkknc8dby9GZWp1RXO_XOCh73vL - MNiDSd4BFg',
    'rememberme': 'forever',
    'redirect_to': 'https://icls.com.br/wp-admin/users.php',
    'testcookie': '1'
}
const URL = 'https://icls.com.br/wp-login.php'
const METHOD = 'POST'

// button id = wp-submit

const date = new Date();

const time = `${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`



async function Scrape() {

    const usersArray = [];

    console.log('Script Started.')

    // launching puppeteer browser
    console.log('Launching Browser...');
    const browser = await puppeteer.launch();
    console.log('OLaunched.');

    // opening browser
    console.log('Opening Browser Page...');
    const page = await browser.newPage();
    console.log('Opened.');

    // going to login page
    console.log('Going to login page...');
    await page.goto('https://icls.com.br/wp-login.php', { waitUntil: 'networkidle0' });
    console.log('Done.');

    // type credencials
    console.log('Typing user credencials...');
    await page.type('#user_login', loginData['log']);
    await page.type('#user_pass', loginData['pwd']);
    console.log('Done.');

    // Click 
    console.log('Logging in...')
    await Promise.all([
        page.click('#wp-submit'),
        page.waitForNavigation({ waitUntil: 'networkidle0', }),
    ]);
    console.log('Logged in.')

    // going to subscribed users page
    console.log('Going to subscribed users page...')

    // Loop throught all available pages
    console.log('Started search through all pages...')
    for (let i = 1; i <= 47; i++) {
        console.log(`For page ${i}:`)
        await page.goto(`https://icls.com.br/wp-admin/users.php?filter_group_ids%5B0%5D=2&paged=${i.toString()}`, { waitUntil: 'networkidle0' });

        // get All users id from this page
        console.log('Getting all users id from page...');
        const idObject = await page.evaluate(() => {
            let tableIds = document.querySelector('.wp-list-table').tBodies[0].rows;
            const idArray = [];
    
            Object.values(tableIds).forEach(val => {
                idArray.push(val.id.replace('user-', ''))
            })

            return idArray
        })

        console.log(!!idObject)
        console.log('Done.')

        // Looping through users of page 
        console.log('Getting users info from page...');

        for (let x = 0; x < idObject.length; x++) {
            await page.goto(`https://icls.com.br/wp-admin/user-edit.php?user_id=${idObject[x].toString()}&wp_http_referer=%2Fwp-admin%2Fusers.php%3Ffilter_group_ids%255B%255D%3D2`, {waitUntil: 'networkidle0'});

            userObject = await page.evaluate(() => {
                let email = document.getElementById('email').value;
                let firstname = email.substring(0, email.indexOf('@'));
                let lastPayment = document.querySelector('.timestamp')?.innerHTML || 'Infinity'

                const dumbObject = {
                    lastPayment: lastPayment,
                    email: email,
                    firstname: firstname
                }

                return dumbObject
            })
            usersArray.push(userObject);
            process.stdout.write("\r\x1b[K");
            process.stdout.write(`${x + 1}/${idObject.length }`);

        }
        console.log(' ');
        console.log('Done.');
        console.log(`Finished page ${i}`);
    }
    console.log('Searched all pages.')
    
    const usersJson = JSON.stringify(usersArray)

    
    // closing browser
    console.log('Closing browser...');
    await browser.close();
    console.log('Closed.');

    console.log('Writing data to file...')
    fs.writeFile("output/users.json", usersJson, 'utf8', function (err) {
         if (err) {
             console.log("An error occured while writing JSON Object to File.");
             return console.log(err);
         }
      
         console.log("JSON file has been saved.");
        })
    
    console.log('Scraped!');

}

// Starting script
Scrape();