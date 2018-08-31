#!/bin/bash
if [ "$1" = "-a" -o "$1" = "--all" ]; then
    ALL_SERVERS=true
fi
how_to_quit ()
{
    if [ "$ALL_SERVERS" ]; then
        kill $s_pid
    fi
    kill $a_pid
    exit 0
}

trap how_to_quit INT

a=""
while [ "$a" != "q" ]; do
    if [ "$ALL_SERVERS" ]; then
        ./ws_server.py --server &
        s_pid=$!
    fi
    ./ws_server.py --application &
    a_pid=$!
    a=""
    echo "['r' + 'enter'] to reload, ['CTRL' + 'c'] or ['q' + 'enter'] to exit"
    while [ "$a" = "" ]; do
        read a
    done
    if [ "$ALL_SERVERS" ]; then
        kill $s_pid
    fi
    kill $a_pid
    sleep 1
done


