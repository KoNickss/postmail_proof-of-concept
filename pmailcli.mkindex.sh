#!/bin/bash

INDEXFILE=""
ATTACHMENTS=""

TITLE=""
USERNAMEx=""
SRVx=""
DESTu=""
read -p "Username LOGIN: " USERNAMEx
read -p "Server LOGIN: " SRVx
read -p "Send to (user:server.tld) -> " DESTu

USERu=$(echo $DESTu | cut -f 1 -d ':')
SRVu=$(echo $DESTu | cut -f 2 -d ':')
echo "Generating Token..."
TOKEN=$(cat /dev/urandom | head -c 100 | sha256sum | head -c 20)

TOKEN="${USERu}:${SRVu}:${TOKEN}"

read -p "Mail Title: " TITLE

echo "Write Mail Body Here" > buf.txt
nano buf.txt
mv buf.txt message

MESSAGE="$(bash pmailcli.upload.sh $USERNAMEx ./message $TOKEN)"

ATTACHEMENTS="{"


for file in $@
do
	echo $file
	item="$(bash pmailcli.upload.sh $USERNAMEx $file $TOKEN)"
	ATTACHEMENTS="$ATTACHEMENTS$item,"
done

ATTACHEMENTS=${ATTACHEMENTS::-1}
ATTACHEMENTS="$ATTACHEMENTS}"

if [[ $ATTACHEMENTS == "}" ]];
then
	ATTACHEMENTS='""'
fi

INDEXFILE="{\"title\":\"$TITLE\",$MESSAGE,\"attachements\":$ATTACHEMENTS}"

echo $INDEXFILE > index.pmail


bash pmailcli.upload.sh $USERNAMEx index.pmail $TOKEN
MSGID=$(sha256sum index.pmail | cut -d ' ' -f 1)
rm index.pmail
rm message


echo -ne "\n\n\n+++++ RECEIVER'S CONCLUSION +++++\n\n	--> "
curl http://$SRVu:27050/sendnotice\?id\=${MSGID}\&token\=${TOKEN}\&user\=${USERu}\&sender\=${USERNAMEx}:${SRVx}
echo -ne "\n\n+++++ END +++++\n\n"
echo "curl http://$SRVu:27050/sendnotice\?id\=${MSGID}\&token\=${TOKEN}\&user\=${USERu}\&sender\=${USERNAMEx}:${SRVx}"

