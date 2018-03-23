#!/bin/bash
how_to_quit ()
{
    kill $s_pid $a_pid
    exit 0
}

trap how_to_quit INT

a=""
while [ "$a" != "q" ]; do
    ./ws_server.py --server &
    s_pid=$!
    ./ws_server.py --application &
    a_pid=$!
    a=""
    echo "['r' + 'enter'] to reload, ['CTRL' + 'c'] or ['q' + 'enter'] to exit"
    while [ "$a" = "" ]; do
        read a
    done
    kill $s_pid $a_pid
    sleep 1
done


