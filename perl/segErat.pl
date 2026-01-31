#!/usr/bin/perl
my($threads,$n)=@ARGV;
my$limit=int(sqrt($n));
my@primes;

# Simple sieve up to sqrt(n)
my@base=(1)x($limit+1);
$base[0]=$base[1]=0;
for(my$i=2;$i*$i<=$limit;$i++){
    if($base[$i]){
        for(my$j=$i*$i;$j<=$limit;$j+=$i){$base[$j]=0}
    }
}
for my$i(2..$limit){push@primes,$i if$base[$i]}

my$total=@primes;
if($limit>=$n){print"$total\n";exit}

my$seg=32768;
my(@pipes,@pids);

# Fork workers
for my$t(0..$threads-1){
    pipe my($r,$w);
    my$pid=fork();
    if($pid==0){
        close$r;
        my$count=0;
        my$start=$limit+1+$t*$seg;
        for(my$low=$start;$low<=$n;$low+=$threads*$seg){
            my$high=$low+$seg-1;
            $high=$n if$high>$n;
            my$size=$high-$low+1;
            my@seg_pr=(1)x$size;
            for my$p(@primes){
                my$mark=int(($low+$p-1)/$p)*$p;
                $mark=$p*$p if$mark<$p*$p;
                for(my$j=$mark;$j<=$high;$j+=$p){$seg_pr[$j-$low]=0 if$j>=$low}
            }
            $seg_pr[0]=0 if$low==1;
            $count+=grep{$_}@seg_pr;
        }
        print$w pack("Q",$count);
        close$w;
        exit;
    }else{
        close$w;
        push@pipes,$r;
        push@pids,$pid;
    }
}

# Collect results
for my$r(@pipes){
    my$buf;read($r,$buf,8);$total+=unpack("Q",$buf);close$r
}

# Reap children
waitpid($_,0)for@pids;

print"$total\n";