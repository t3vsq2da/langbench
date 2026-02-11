#!/usr/bin/perl
use strict;
use warnings;
use threads;
use threads::shared;
use IO::Socket::INET;

my $n = shift @ARGV || 5;
my ($sum, $cnt) = (0, 0);
my $exited : shared = 0;  # Флаг: уже завершились?
share($sum); share($cnt);

my $s = IO::Socket::INET->new(LocalPort => 8080, ReuseAddr => 1, Listen => 10) or die;

while (my $c = $s->accept) {
    threads->create(sub {
        my $cl = shift;
        
        <$cl>;  # Пропускаем строку запроса
        
        my ($len, $h);
        while ($h = <$cl>) {
            last if $h =~ /^\r?$/;
            $len = $1 if $h =~ /Content-Length:\s*(\d+)/i;
        }
        
        my $body;
        read($cl, $body, $len);
        
        my ($num) = $body =~ /"data"\s*:\s*(-?\d+)/;
        
        my $should_exit = 0;
        {
            lock($sum);
            lock($cnt);
            lock($exited);
            
            if (!$exited) {
                $sum += $num;
                $cnt++;
                if ($cnt >= $n) {
                    $exited = 1;
                    $should_exit = 1;
                }
            }
        }
        
        print $cl "HTTP/1.1 200 OK\r\n\r\nOK\n";
        close $cl;
        
        if ($should_exit) {
            print "$sum\n";
            $s->close();
            exit 0;
        }
    }, $c)->detach;
}