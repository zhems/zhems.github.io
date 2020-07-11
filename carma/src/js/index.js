/**
 * Main js file for Car.m.a web application
 *
 * Contains majority of the D3 functionality
 */

d3.select("#landing-banner").attr("width",document.getElementById("landing-bg").clientWidth);

//Global Variables
var svg;
var sim;

var listings = [];
var genres = [["all","All Cars"],["Genre Off Road","Off-Road"],["Genre Family","Family Friendly"],["Genre Fun","Performance"],["Genre Luxury","Luxury"]];
var genre;

////////////////////// Landing Page /////////////////////////

d3.select("#micro-genres")
    .selectAll("option")
    .data(genres)
    .enter()
    .append("option")
    .attr("value",function(d) {
        return d[0]
    })
    .text(d => d[1]);

/////////////////////////////////////////////////////////////

//Tooltip for each listing
var tip = d3.tip()
    .direction(function(d) {
        var title_height = document.getElementById("controls").clientHeight;
        var height = window.innerHeight - title_height;
        if (d.y < height / 2) {
            return "s";
        } else {
            return "n";
        }
    })
    .html(function(d,width,height) {
        if (d.image_url.length == 0) {
            return "<div class=\"tip alert alert-dark\">" +
                "<h4>" + d.build.year + " " + d.build.make + " " + d.build.model + "</h4>" +
                "<br /><br />" +
                "<span>No image available</span>" +
                "</div>";
        } else {
            var pic_width = Math.min(300,(d3.select("#canvas").attr("width") - 20));
            return "<div class=\"tip alert alert-dark\">" +
                "<h4>" + d.Year + " " + d.Make + " " + d.Model + "</h4>" +
                "<span>Price: $" + d.price + "</span>" + 
                "<br /><br />" +
                "<img " + 
                "width=" + pic_width + " " +
                "src=" + d.image_url + " />" +
                "</div>"
        }
    });


////////////////////// Event Handlers /////////////////////////

$('#filter-zip').keyup(function(e) {
    var zip = document.getElementById("filter-zip").value;
    if (zip.length == 5) {
        document.getElementById("filter-zip").value = "";
        /* DEACTIVATED FOR DEMO
        d3.json("data/" + zip).then(function(dump) {
            listings = dump.listings;
            nav(listings);
            rank();
        });
        */
    }
});

$('#genres').change(function() {
    genre = document.getElementById("filter-genres").value;
    filter();
});

$('#filter').change(function() {
    filter();
});

$('#rank').change(function() {
    rank();
});

$(document).on("click", "#side-toggler", function() { 
});

$(document).on("click", "#search", function() {
    search();
});

$(document).on("submit", "#search-form", function(e) {
    console.log(e)
    if (e.which == 13) {
        e.preventDefault();
        search();
    }
});

///////////////////////////////////////////////////////////////

////////////////////// Functions /////////////////////////

//Search function triggers on click from landing page
function search() {
    var title_height = document.getElementById("controls").clientHeight;
    var height = window.innerHeight - title_height;
    var width = document.getElementById("testbed").clientWidth;

    //Main Canvas
    svg = d3.select("#testbed")
        .append("svg")
        .attr("id","canvas")
        .attr("width",width)
        .attr("height",height)
        .call(function(d) {
            tip(d,width,height);
        })
        .call(function(d) {
            resize(d,sim)
        });

    var zip = document.getElementById("zip").value;
    if (zip == "") {
        zip = 30318;
    }
    genre = document.getElementById("micro-genres").value;

    //Sample dataset for demo purposes
    d3.json("data/sample.json").then(function(dump) {
        listings = dump.listings;
        console.log(listings);
        nav(listings);
        rank();
    });
};

//Dynamically build filter list
function nav(listings) {
    
    d3.select("#filter-genres")
        .selectAll("option")
        .data(genres)
        .enter()
        .append("option")
        .attr("value",function(d) {
            return d[0]
        })
        .text(d => d[1]);

    var default_genre = document.getElementById('filter-genres');

    for(var i, j = 0; i = default_genre.options[j]; j++) {
        if(i.value == genre) {
            default_genre.selectedIndex = j;
            break;
        }
    }

    var price = d3.extent(listings,function(d) {
        return d.price;
    });

    d3.select("#filter-price-label")
        .text("Maximum Price: " + price[1]);

    var filter_price = d3.select("#filter-price")
                        .attr("min",price[0])
                        .attr("max",price[1])
                        .attr("value",price[1]);

    var year = d3.extent(listings,function(d) {
        return d.Year;
    });

    d3.select("#filter-year-label")
        .text("Minimum Year: " + year[0]);

    var filter_year = d3.select("#filter-year")
                        .attr("min",year[0])
                        .attr("max",year[1])
                        .attr("value",year[0]);

    d3.select("#filter-make")
        .selectAll("option")
        .data([])
        .exit().remove();

    var make = d3.set(listings,function(d) {
        return d.Make;
    }).values().sort();
    make.unshift("All Brands");

    var filter_make = d3.select("#filter-make")
        .selectAll("option")
        .data(make)

    filter_make.enter()
        .append("option")
        .attr("value",function(d) {
            return d;
        })
        .text(function(d) {
            return d;
        });

    d3.select("#filter-style")
        .selectAll("option")
        .data([])
        .exit().remove();

    var style = d3.set(listings,function(d) {
        return d.bodystyles;
    }).values().filter(x => x != "undefined").sort();
    style.unshift("All Body Styles");

    var filter_style = d3.select("#filter-style")
        .selectAll("option")
        .data(style)

    filter_style.enter()
        .append("option")
        .attr("value",function(d) {
            return d;
        })
        .text(function(d) {
            return d;
        });

}

//Draw nodes
function draw(f_listings) {

    var title_height = document.getElementById("controls").clientHeight;
    var height = window.innerHeight - title_height;
    var width = document.getElementById("testbed").clientWidth;

    //Circles
    svg.selectAll("text")
        .remove();

    //Clustering positions
    var collisionForce = d3.forceCollide(function(d) {
            return d.r + 10;
        })
        .strength(1)
        .iterations(200);
    var centeringForce = d3.forceCenter(width / 2,height / 2)
    var splitForce = d3.forceRadial()
        .x(width / 2)
        .y(height / 2)
        .radius(function(d) {
            if (d[genre] != "True") {
                return 300;
            } else {
                return 0;
            }
        })
        .strength(0.4);
    var chargeForce = d3.forceManyBody()
        .strength(-60)
        .distanceMax(function(d) {
            return d.r + 10
        });

    sim = d3.forceSimulation(f_listings)
            .force("collide",collisionForce)    //Prevent node overlap
            .force("center",centeringForce)     //Center nodes onto middle of viewport
            .force("charge",chargeForce)        //Push away nodes close to each other
            .force("split",splitForce)          //Cluster nodes radially
            .on("tick",ticked);
    
    //Static force-directed graph
    sim.stop();
    sim.tick();
    sim.tick();
    sim.tick();
    sim.tick();
    sim.tick();
    sim.tick();
    sim.tick();
    sim.tick();

    //Draw circles
    var circles = svg.selectAll("circle")
        .data(sim.nodes())

    circles.exit()
        .transition()
            .duration(300)
            .style("fill-opacity",0)
            .remove();

    var nodes = circles.enter()
        .append("circle")
        .attr("r",function(d) {
            return d.r;
        })
        .attr("cx",function(d) {
            return d.x;
        })
        .attr("cy",function(d) {
            return d.y;
        })
        .style("fill-opacity",0)
        .style("fill",function(d) {
            if (d[genre] == "False") {
                return "#E6E6E6";
            } else {
                return "#F94D4D";
            }
        })
        .on("mouseover",tip.show)
        .on("mouseout",tip.hide)
        .on("click",function(d) {
            window.open(d.listing_url);
        })
        .transition()
            .duration(300)
            .style("fill-opacity",1)
            .attr("r",function(d) {
                return d.r;
            });

    circles.transition()
        .duration(400)
        .attr("cx",function(d) {
            return d.x;
        })
        .attr("cy",function(d) {
            return d.y;
        })
        .attr("r",function(d) {
            return d.r;
        })
        .style("fill",function(d) {
            if (d[genre] == "False") {
                return "#E6E6E6";
            } else {
                return "#F94D4D";
            }
        });

    //If no listings found
    if (f_listings.length == 0) {
        svg_height = svg.attr("height");
        svg_width = svg.attr("width");
        svg.append("text")
            .attr("x",svg_width / 2)
            .attr("y",svg_height / 2)
            .text("No listings match your requirements")
            .classed("404",true);

    }
}

//Static simulation
function ticked() {
    svg.selectAll("circle")
        .attr("cx",function(d) {
            return d.x;
        })
        .attr("cy",function(d) {
            return d.y;
        });
}

//Responsive design
function resize(svg,force) {
    d3.select(window)
        .on("resize",function() {
            var width = document.getElementById("testbed").clientWidth;
            var title_height = document.getElementById("controls").clientHeight;
            var height = window.innerHeight - title_height;
            svg.attr("width",width)
                .attr("height",height);
            var centeringForce = d3.forceCenter(width / 2,height / 2);
            sim.force("center",centeringForce);
            sim.restart();
        });
}

//Filter function
//Filters listings by user preference
function filter() {
    var filtered = listings;

    var max_price = document.getElementById("filter-price").value;
    filtered = filtered.filter(function(d) {
        return d.price <= max_price;
    });
    d3.select("#filter-price-label")
        .text("Maximum Price: " + max_price);

    var min_year = document.getElementById("filter-year").value;
    filtered = filtered.filter(function(d) {
        return d.Year >= min_year;
    });
    d3.select("#filter-year-label")
        .text("Minimum Year: " + min_year);

    var selected_make = document.getElementById("filter-make").value;
    if (selected_make != "All Brands") {
        filtered = filtered.filter(function(d) {
            return d.Make == selected_make;
        });
    } 

    var selected_style = document.getElementById("filter-style").value;
    if (selected_style != "All Body Styles") {
        filtered = filtered.filter(function(d) {
            return d.bodystyles == selected_style;
        });
    }

    draw(filtered);
}

//Ranking function
//Rank cars weighted by user preference
function rank() {
    var reliability = +(document.getElementById("rank-reliable").value) + 0.1;
    var performance = +(document.getElementById("rank-performance").value)+ 0.1;
    var mpg = +(document.getElementById("rank-mpg").value) + 0.1;
    var resale = +(document.getElementById("rank-resale").value) + 0.1;

    listings.forEach(function(d) {
        d.rank = (reliability * +d["Reliability"]) +
            (performance * +d["Driving Experience"]) +
            (mpg * +d["Fuel Economy"]) +
            (resale * +d["Resale Value"])
    });
    ranking = d3.extent(listings,function(d) {
        return d.rank;
    });
    r_scale = d3.scaleSqrt()
        .domain(ranking)
        .range([2,35]);

    listings.forEach(function(d) {
        d.r = r_scale(d.rank);
    });
    filter();
}

//////////////////////////////////////////////////////////
