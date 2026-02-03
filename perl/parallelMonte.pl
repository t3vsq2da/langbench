use strict;
use warnings;
use threads;

my ($threads, $total) = @ARGV;
my $per_thread = int($total / $threads);

my @thr;
for my $t (0..$threads-1) {
    push @thr, threads->create(sub {
        my $seed = $t + 12345;
        my $hits = 0;
        for (1..$per_thread) {
            $seed = ($seed * 1664525 + 1013904223) & 0x7fffffff;
            my $x = $seed / 2147483647.0;
            $seed = ($seed * 1664525 + 1013904223) & 0x7fffffff;
            my $y = $seed / 2147483647.0;
            $hits++ if $x*$x + $y*$y <= 1.0;
        }
        return $hits;
    });
}

my $total_hits = 0;
$total_hits += $_->join() for @thr;

my $pi = 4.0 * $total_hits / ($per_thread * $threads);
print "$pi\n";