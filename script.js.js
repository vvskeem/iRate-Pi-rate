//movie ID API
let movieDB_api = 'https://api.themoviedb.org/3/discover/movie?with_genres='
let api_key = '&api_key=20e614ec920902938a18f800658406c3&language=en-US'

let image_url = "https://image.tmdb.org/t/p/w400"
//giphy api
let gif_Api = "https://api.tenor.com/v1/search?tag="
let gif_key = "&key=V156DEG9RW12&limit=18"





$(".genre").on("click", function (event) {

    // used later in code incordinacne with Movie api to search for movies by ID#
    let genre_Number = $(event.target).attr("genre_id")
    console.log(genre_Number)


    //adding gif on click 
    //sets the text selected on the onclick event, into a variable which is then used in the search for relevant gifs
    let create_gif = $(event.target).html()
    let gif_Search = gif_Api + create_gif

    // APi ket is added to the end of the search parameters, to recieve pasrsed data from supplier
    let gif_Url = gif_Search + gif_key
    console.log(gif_Url)

    //clears previous divs 
    $("#gif").empty()
    $("#gif2").empty()

    // to recieve parased data a get request is sent to server and response.results is the relevant path
    $.get(gif_Url, function (response) {
        let gif_Data = response.results

        //Data is sent in multiple array format so a for loop is needed access correct path of data
        for (let index = 0; index < gif_Data.length; index++) {

            const gif_Results = gif_Data[index];
            console.log(gif_Results)


            let actual_Gif = gif_Results.media[0].tinygif.url

            //applying attributes to gifs through Jquery 
            let gif_Url_Image = $("<img>").attr({
                src: actual_Gif,
                class: "card-img-top",

            })
            //gifs will be broken down into seperate divs with half in one div and the other half in another,
            //this is how we seperate the data
            if (index < 9) {
                $("#gif").prepend(gif_Url_Image)
            } else {
                $("#gif2").prepend(gif_Url_Image)
            }


        }
    })

    //movie api seach by genere number will give us the most popular selections of that category, api key is also needed
    let genre_Search = movieDB_api + genre_Number + api_key
    console.log(genre_Search)

    //deleting previous selcections
    $("#newClickMovie").empty()

    //get request to movieDb for data
    $.get(genre_Search, function (response) {
        let data = response.results;

        //here we specify that we only want 5 movie selections through a four loop
        for (let index = 0; index < data.length; index++) {
            if (index > 4) break;

            //We are able to select the relevant path of data through the documentation provided by movieDb, 
            //Store the data in variable which we use as individual pieces to create a movie card 
            const element = data[index];
            let title = element.title
            let year = element.release_date
            let poster = image_url + element.poster_path

            //if a poster image is not aviable the code will continue 
            if (poster === "N/A") {
                continue;
            }

            $("#carouselExampleControls").empty()

            //here we create cards with varibles from above and apply attributes

            let card = $('<div>').attr({

                class: "card movieCard",
                style: "margin-bottom: 50px",
            })
            let card_Image = $("<img>").attr({
                src: poster,
                class: "card-img-top",
                alt: title
            })
            let cardBody = $("<div>").attr("class", "card-body")
            let cardTitle = $("<h5>").attr("class", "card-text").html(title)
            let cardYear = $('<p>').attr("class", "card-text").html(year)

            //rating buttons are made and prepeneded to buttom of cards 
            //they are also given specidic Movie id's which are relevant to the movie displayed
            //by applying this attitubute we are able to track a vote for or against a specific movie
            //this information is what we store in out database

            let rating_button = $("<div>").attr("id", element.id)

            let iRate = $('<button>').attr({
                class: "btn btn-primary",
                movieId: element.id

            }).html("iRate")
            let iHate = $('<button>').attr({
                class: "btn btn-primary",
                movieId: element.id

            }).html("iHate")

            rating_button.append(iRate, iHate)

            cardBody.append(cardTitle).append(cardYear).append(rating_button);
            card.append(card_Image).append(cardBody);

            $("#newClickMovie").append(card)
        }
    })

})

$("#newClickMovie").on("click", function (event) {

    // Unique movie id to use in the db to know which movie was clicked on
    let movieId = $(event.target).attr("movieId");

    // Specifying what action the user took
    let voteType = $(event.target).html(); // iRate or iHate

    let database = firebase.database();

    // Figure out what we already have in the databasse
    database.ref(movieId).once("value", function (snap) {

        if (snap.val() === null) {
            // The movies is not already in the db
            // Create an object for the movie and send it to the db

            let iRateNumber = 0;
            let iHateNumber = 0;

            if (voteType === "iRate") {
                iRateNumber = 1
            } else {
                iHateNumber = 1
            }
            //store in database as an object with keys
            let movieVote = {
                [movieId]: {
                    iRate: iRateNumber,
                    iHate: iHateNumber,
                }
            }

            //this updates our page with new data from database
            database.ref().update(movieVote, function () {
                updatePage(movieId, event)
            })

        } else {
            // The movie is already there
            let movieInDb = snap.val();
            //add to whats already in database if movie vote is already present
            if (voteType === "iHate") {
                movieInDb.iHate++
            } else {
                movieInDb.iRate++
            }

            database.ref().update({
                [movieId]: movieInDb
            }, function () {
                updatePage(movieId, event)
            })
        }





    })

})
//update page function is stored in a fuction which we implace in the relevant spaces above
//this was done in order to simplyfy code and make it user friendly
function updatePage(movieId, clickEvent) {
    let database = firebase.database();
    database.ref(movieId).once("value", function (snap) {

        let movieInDb = snap.val()
        var buttonId = "#" + movieId;

        let newParagraph = $("<p>").html(movieInDb.iHate)

        let newParagraph2 = $("<p>").html(movieInDb.iRate)

        let btnContainer = $($(clickEvent.target)[0]).parent()[0]
        let cardBody = $(btnContainer).parent()[0];
        $(buttonId).empty()
        $(cardBody).append(newParagraph, newParagraph2)


    })
}