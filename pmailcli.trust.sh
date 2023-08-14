#!/bin/bash

USER=""
ME=""

read -p "User LOGIN: " ME
read -p "User to TrustList (user:srv.tld) -> " USER

echo $USER >> repo/$ME/notices/trustlist
mv repo/$ME/notices/purgatory/$USER/* repo/$ME/notices/trusted/.
