#!/bin/bash
USER=""
read -p "Username: " USER
install -d repo/$USER/deposit
install -d repo/$USER/pub
install -d repo/$USER/notices/trusted
install -d repo/$USER/notices/purgatory
install -d repo/$USER/mail/new
install -d repo/$USER/mail/old
touch repo/$USER/notices/banlist
touch repo/$USER/notices/ipbanlist
touch repo/$USER/notices/trustlist
