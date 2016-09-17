module.exports = function (params) {

    // Params
    var server = params.server;

    server.get('/', function (req, res) {
        res.render('index.html', {pageCountMessage: null});
    });

    server.get('/pagecount', function (req, res) {
        res.send('{ pageCount: -1 }');
    });

};