#!/usr/bin/perl
use strict;
use warnings;

my $n = $ARGV[0];

my $inside = 0;
for (1..$n) {
    my $x = rand();
    my $y = rand();
    $inside++ if ($x*$x + $y*$y <= 1.0);
}

printf "%.15f\n", 4.0 * $inside / $n;