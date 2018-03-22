#!/bin/bash
a=""
while [ "$a" != "q" ]; do
    ./ws_server.py --server &
    s_pid=$!
    ./ws_server.py --application &
    a_pid=$!
    a=""
    echo "['r' + 'enter'] to reload, ['q' + 'enter'] to exit"
    while [ "$a" = "" ]; do
        read a
    done
    kill $s_pid $a_pid
    sleep 1
done


