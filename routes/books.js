const express = require("express"),
      router = express.Router();

const bookController = require('../controllers/books');

router.get("/books/:filter/:value/:page", bookController.getBooks);

router.post("/books/:filter/:value/:page", bookController.findBooks);

router.get("/books/details/:book_id", bookController.getBookDetails);

module.exports = router;