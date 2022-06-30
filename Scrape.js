const puppeteer = require('puppeteer');
const fs = require('fs');

const loginData = {
    'log': 'yourlogin',
    'pwd': 'yourpass',
}




// Adjust the script for your needs: Element ids and classes, goto() urls, etc.

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
    await page.goto('https:your-site.com/wp-login.php', { waitUntil: 'networkidle0' });
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

    // just to know when the loop  will start
    console.log('Going to subscribed users page & Starting Search through all pages...')

    // Loop throught all available pages --- I used fixed number of loops because i didn't have any reason to not
    for (let i = 1; i <= 47; i++) {
        console.log(`For page ${i}:`)
        // going to the page that have the info i need to reach the loop of pages that has the user information
        await page.goto(`https:your-site.com/wp-admin/users.php?filter_group_ids%5B0%5D=2&paged=${i.toString()}`, { waitUntil: 'networkidle0' });

        // get All users id from this page
        console.log('Getting all users id from page...');
        // inside evaluate you can use any Js as if you were on the page yourself
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

        // Looping through page of each user
        console.log('Getting users info from page...');

        for (let x = 0; x < idObject.length; x++) {
            await page.goto(`https://your-site/wp-admin/user-edit.php?user_id=${idObject[x].toString()}&wp_http_referer=%2Fwp-admin%2Fusers.php%3Ffilter_group_ids%255B%255D%3D2`, {waitUntil: 'networkidle0'});


            // Thats the logic i used for the info i needed -- you probably CAN'T use the same as i did.
            // But inside page.evaluate it's just  Js, you probably can do your own easily
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
            // Simple one-line terminal progress counter 
            process.stdout.write("\r\x1b[K"); // This line just remove the previous CLI message e.g: remove 2/15 at the same time that 3/15 is printed and so on
            process.stdout.write(`${x + 1}/${idObject.length }`);

        }
        console.log(' '); // this line just remove a cli visual bug because i mixed process. with console.log
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