#!/usr/bin/perl
use strict;
use warnings;
use IO::Socket::INET;

my $port = $ARGV[0] // 8080;

my $server = IO::Socket::INET->new(
    LocalPort => $port,
    Listen    => 10,
    Reuse     => 1,
    Proto     => 'tcp'
) or die "Cannot bind to port $port: $!\n";

print "HTTP server started on http://localhost:$port\n";

while (my $client = $server->accept()) {
    # Устанавливаем таймаут, чтобы не ждать вечно
    $client->timeout(5);

    my $request_line = <$client>;

    # Если клиент ничего не прислал — закрываем
    if (!defined $request_line || $request_line eq '') {
        close $client;
        next;
    }

    chomp $request_line;

    # Извлекаем n из URL (если есть)
    my $n = 1000; # значение по умолчанию
    if ($request_line =~ /\?n=(\d+)/) {
        $n = $1;
    }

    # Простая нагрузка: вычислим сумму 1..n
    my $sum = 0;
    $sum += $_ for 1..$n;

    print $client "HTTP/1.1 200 OK\r\n";
    print $client "Content-Type: text/plain; charset=utf-8\r\n";
    print $client "Connection: close\r\n";
    print $client "\r\n";
    print $client "Requested: $request_line\n";
    print $client "n = $n, sum(1..n) = $sum\n";

    close $client;
}