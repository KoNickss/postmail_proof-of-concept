#!/bin/bash

USERNAMEx=""

read -p "Username LOGIN: " USERNAMEx

NOTICEFOLDER="repo/${USERNAMEx}/notices/trusted/"

MAILFOLDER="repo/${USERNAMEx}/mail/new/"

for file in $(ls ${NOTICEFOLDER})
do
	mkdir ${MAILFOLDER}$file
	mv ${NOTICEFOLDER}$file ${MAILFOLDER}$file/$file
	NOTICEFILE="${MAILFOLDER}$file/$file"
	MSGID=$(cat $NOTICEFILE | jq '.id' -r)
	SENDERstr=$(cat $NOTICEFILE | jq '.sender' -r)
	TOKEN=$(cat $NOTICEFILE | jq '.token' -r)
	USERu=$(echo $SENDERstr | cut -d ':' -f 1)
	SRVu=$(echo $SENDERstr | cut -d ':' -f 2)

	echo -ne "\n\n---> NEW MAIL BY $SENDER"

	#MAKE FETCH REQ

	curl -q http://$SRVu:27050/get\?id\=${MSGID}\&user\=${USERu}\&token\=${TOKEN} > ${MAILFOLDER}$file/index.pmail
	echo "-> curl http://$SRVu:27050/get\?id\=${MSGID}\&user\=${USERu}\&token\=${TOKEN}"
	
	PMAILFILE="${MAILFOLDER}$file/index.pmail"

	MAILTITLE=$(cat $PMAILFILE | jq '.title' -r)

	echo -ne $MAILTITLE > ${MAILFOLDER}$file/MESSAGE
	echo -ne "\n----------------------\n" >> ${MAILFOLDER}$file/MESSAGE
	echo -ne "(${SENDERstr})\n\n" >> ${MAILFOLDER}$file/MESSAGE
	
	TEXTID=$(cat $PMAILFILE | jq '.message' -r)

	curl -q http://$SRVu:27050/get\?id\=${TEXTID}\&user\=${USERu}\&token\=${TOKEN} >> ${MAILFOLDER}$file/MESSAGE
	echo "-> curl http://$SRVu:27050/get\?id\=${TEXTID}\&user\=${USERu}\&token\=${TOKEN}"
	echo "MESSAGE DOWNLOADED SUCCESFULLY"
	ATTS=$(cat ${MAILFOLDER}$file/index.pmail | jq '.attachements')
	echo $ATTS > ${MAILFOLDER}$file/ATTACHEMENTS

	echo -ne "---------------RECEIVED MESSAGE SUCESFULLY----------------\n\n\n\n\n\n\n\n\n\n"
	less ${MAILFOLDER}$file/MESSAGE
done
