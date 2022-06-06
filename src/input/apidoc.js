/**
 * @api {get} /api/user/:id Requests user's favourite movie list
 * @apiName GetFavourites
 * @apiGroup Users
 *
 * @apiParam {Number} id Users id.
 * @apiSuccess {String} id Id of the User.
 * @apiSuccess {String} list User's favourite movie list.
 *
 * @apiSuccessExample Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *         "id": "test",
 *         "list": ["Titanic","Cars","Back to the Titanic"],
 *    }
 *
 * @apiError error Id not found.
 * @apiErrorExample Error-Response:
 *    HTTP/1.1 404 Not found
 *    {
 *        "error": "Id not found"
 *    }
 * @apiError error Internal server error.
 * @apiErrorExample Error-Response:
 *    HTTP/1.1 500 Internal server error
 *    {
 *        "error": "The server encountered an unexpected condition which prevented it from fulfilling the request."
 *    }
 *
 */
/**
 * @api {get} /api/recommended/:genre Recommend a movie based on genre
 * @apiName GetRecommendedMovie
 * @apiGroup Movies
 *
 * @apiParam {String} genre Genre.
 * @apiSuccess {String} recommended Recommended movie title.
 *
 * @apiSuccessExample Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *         "recommended": ["Titanic"],
 *    }
 *
 * @apiError error Genre not found.
 * @apiErrorExample Error-Response:
 *    HTTP/1.1 404 Not found
 *    {
 *        "error": "Genre not found"
 *    }
 * @apiError error Internal server error.
 * @apiErrorExample Error-Response:
 *    HTTP/1.1 500 Internal server error
 *    {
 *        "error": "The server encountered an unexpected condition which prevented it from fulfilling the request."
 *    }
 *
 */
/**
 * @api {get} /api/topten Requests Netflix Top Ten
 * @apiName GetNetflixTopTen
 * @apiGroup Movies
 *
 * @apiSuccess {Number} list Ranking
 *
 * @apiSuccessExample Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *         "recommended":[{"list":1,"name":"A Perfect Pairing"},{"list":2,"name":"Senior Year"},{"list":3,"name":"Jackass 4.5"},{"list":4,"name":"Dangerous"},{"list":5,"name":"Sonic the Hedgehog"},{"list":6,"name":"Top Gun"},{"list":7,"name":"Cleveland Abduction"},{"list":8,"name":"Turbo"},{"list":9,"name":"Our Father"},{"list":10,"name":"Ben Is Back"}]
 *    }
 *
 * @apiError error Internal server error.
 * @apiErrorExample Error-Response:
 *    HTTP/1.1 500 Internal server error
 *    {
 *        "error": "The server encountered an unexpected condition which prevented it from fulfilling the request."
 *    }
 *
 */