# Doc server #

## Motivation ##

This util allows me to symlink all my markdown based documentation into a directory and have it served
up by a node instance. Styles are applied and a simple index is created.

## Prerequisites ##

Install Discount

    cd ~/src
    git clone https://github.com/Orc/discount.git
    cd discount
    ./configure.sh
    make
    sudo make install
    
or

    brew install Discount
