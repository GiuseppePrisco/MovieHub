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
 * @apiError error Id not found.
 * @apiErrorExample Error-Response:
 *    HTTP/1.1 404 Not found
 *    {
 *        "error": "Genre not found"
 *    }
 *
 */