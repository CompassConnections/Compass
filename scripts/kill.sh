#!/bin/bash

kill $(fuser -k 3000/tcp)
kill $(fuser -k 8088/tcp)


