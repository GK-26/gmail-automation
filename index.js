const Imap = require('imap');
const fs = require('fs');
const path = require("path");
const {simpleParser} = require('mailparser');

const imapConfig = {
  user: 'gajelli.kiransai@gmail.com',
  password: 'mstjtnnlmjvseilz',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false } // Ignore SSL certificate validation errors
};

// Connect to the IMAP server
const imap = new Imap(imapConfig);

imap.once('ready', () => {
  console.log('Connected to IMAP server');

  // Open the Inbox
  imap.openBox('INBOX', false, (err, box) => {
    if (err) throw err;
    console.log(`Opened INBOX, ${box.messages.total} messages`);

    // Listen for new mail
    imap.on('mail', () => {
      console.log('New email received');

      // Fetch the latest email
      const fetch = imap.seq.fetch(box.messages.total, { bodies: '' });

      fetch.on('message', (msg) => {
        msg.on('body', (stream, info) => {
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', () => {
            simpleParser(buffer, (err, parsed) => {
              if (err) throw err;

              const mailFrom = parsed.from.value[0].address

              const folderPath = `./attachments/${mailFrom}`
              
              // function for saving attachments

              saveAttachments(parsed.attachments, folderPath)

              // console.log('Email attachment', parsed.attachments)
              console.log('Email subject:', parsed.subject);
              console.log('Email body:', parsed.text);
            });
          });
        });
      });
    });
  });
});

imap.once('error', (err) => {
  console.error('IMAP error:', err);
});

imap.once('end', () => {
  console.log('IMAP connection ended');
});

// Start the IMAP connection
imap.connect();


function saveAttachments (attachments, folderPath){
  attachments.forEach((file, index)=>{
    const {content, filename} = file;
    if(!fs.existsSync(folderPath)){
      fs.mkdirSync(folderPath)
    }
    const filePath = path.join(folderPath, filename)

    fs.writeFile(filePath, content, (err)=>{
      if(err){
        console.error(`Error writing file ${filename}:`, err);
      }else{
        console.log(`File ${filename} saved successfully.`);
      }
    })
  })

}