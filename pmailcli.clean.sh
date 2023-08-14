#!/bin/bash

USERNAMEx=""

read -p "User LOGIN: " USERNAMEx

DEPOSIT="repo/$USERNAMEx/deposit/"

for file in $(ls $DEPOSIT)
do
	echo -ne "\n\n\n\n"
	echo "---> Checking $file"
	cat $DEPOSIT$file/meta | jq '.filename'
	cat $DEPOSIT$file/meta | jq '.time' -r | date -d -
	cat $DEPOSIT$file/meta | jq '.description'
	echo -ne '\n'

	if [[ $(cat $DEPOSIT$file/auth) == '' ]];
	then
		echo "	:: FILE HAS BEEN SENT TO EVERYONE!"
		ans=""
		read -p "	Delete File? [rm -rf $DEPOSIT$file] (y/n)" ans
		if [[ $ans == 'y' ]];
		then
			rm -rf $DEPOSIT$file
		fi
	else
		echo "	:: File still pending - Needs to be received by ::"
		for line in $(cat $DEPOSIT$file/auth)
		do
			PERSON=$(echo $line | cut -d ':' -f 1-2)
			echo "	-> $PERSON"
		done
	fi
done
