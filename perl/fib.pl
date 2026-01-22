sub fib {
    my ($n) = @_;
    $n < 2 ? $n : fib($n-1) + fib($n-2);
}

my $n = $ARGV[0];
print fib($n);
