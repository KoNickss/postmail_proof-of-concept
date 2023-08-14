#!/bin/bash

CHECKSUM=$(sha256sum $2 | cut -f 1 -d " ")
FILENAME=$(basename $2)
DESC=""
TIME=$(date +%s)

read -p "Short file description ($FILENAME): " DESC

mkdir repo/$1/deposit/$CHECKSUM
cp $2 repo/$1/deposit/$CHECKSUM/$FILENAME

echo "{\"filename\":\"$FILENAME\",\"persist\":\"false\",\"description\":\"$DESC\",\"time\":\"$TIME\"}" > repo/$1/deposit/$CHECKSUM/meta

echo $3 >> repo/$1/deposit/$CHECKSUM/auth

echo "\"$FILENAME\":\"$CHECKSUM\""
