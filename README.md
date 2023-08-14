# postmail_demo

Postmail (PMAIL) Demo

# SETUP

Run `pmailcli.mkuser.sh` to setup users

Run `node .` to start the server daemon

Use the postmail scripts for management directly on the server through SSH or mount them on any client though sshfs or anyother filesyncing system

The scripts require no args and walk you through all neccesary input

User LOGIN and server LOGIN prompts are reffering to the user and FQDN/IP youre sending the mail as, not TO

As long as your domain points to the server hosting the server daemon and port 27050 is accesible, no further setup is required and you can send and receive mail as your domain


# Scripts

`pmailcli.fetchmail.sh` - Fetch all new mail

`pmailcli.mkindex.sh [file_1] [file_2] ... [file_n]` - Create and send pmail, every arg which is a valid path to a file will render that file as an attachement

`pmailcli.trust.sh` - Whitelist user (NECCESARY for receiving mail from that user)

`pmailcli.clean.sh` - Clean unused uploaded file on your server to save on storage


When sending mail, for every uploaded file you will be asked for a short description, this is strictly private and is used as a little note describing the file so you can judge later based on the note and filename whether you want to delete it or not after it has been sent to every user

