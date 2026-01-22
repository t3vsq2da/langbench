#!/usr/bin/perl
use strict;
use warnings;

my $file_count = $ARGV[0];
my $n = $ARGV[1];

my $READ_BUFFER_SIZE = 65536;
my $CHUNK_SIZE = 65536;

# Pre-create content with n '1' characters
my $content = "1" x $n;

# Write phase
for my $i (0..$file_count-1) {
    my $filename = "file$i";
    open my $fh, '>', $filename or die;
    binmode $fh;
    print $fh $content;
    close $fh;
}

# Read phase - read in chunks and count total bytes
my $total_bytes = 0;
my $buffer;
for my $i (0..$file_count-1) {
    my $filename = "file$i";
    open my $fh, '<', $filename or die;
    binmode $fh;
    while (read($fh, $buffer, $READ_BUFFER_SIZE)) {
        $total_bytes += length($buffer);
    }
    close $fh;
}

# Count chunks of 65536 bytes
my $total_chunks = int($total_bytes / $CHUNK_SIZE);
print "$total_chunks\n";

# Cleanup
for my $i (0..$file_count-1) {
    my $filename = "file$i";
    unlink $filename;
}