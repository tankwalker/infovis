#!/bin/sh
#This file is intended to be a roandomizer of the feedback for the sentiment
#analisys of Buonn Coffee's filtered coffee

n=10
declare -a regions=("Piemonte" "Valle d'Aosta" "Lombardia" "Veneto" "Friuli Venezia Giulia" "Liguria" "Emilia Romagna" "Toscana" "Umbria" "Marche" "Lazio" "Abruzzo" "Molise" "Campania" "Basilicata" "Puglia" "Calabria" "Sicilia" "Sardegna")


#i=0
#while [ "$i" -lt "$n" ]; do
#	echo $i
#	i=`expr ${i} + 1`
#done

i=0
for r in ${regions[@]}; do
	echo $r
	i=`expr $i + 1 `
	echo $i
done
