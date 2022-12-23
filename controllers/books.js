const Book = require('../models/book');
const PER_PAGE = 16;

exports.getBooks = async(req, res, next) => {
    var page = req.params.page || 1;
    const filter = req.params.filter;
    const value = req.params.value;
    let searchObj = {};

    if(filter != 'all' && value != 'all') {
       searchObj[filter] = value;
    }

    try {
       const books = await Book
       .find(searchObj)
       .skip((PER_PAGE * page) - PER_PAGE)
       .limit(PER_PAGE);

       const count = await Book.find(searchObj).countDocuments();
 
       res.render("books", {
          books: books,
          current: page,
          pages: Math.ceil(count / PER_PAGE),
          filter: filter,
          value: value,
          user: req.user,
       })
    } catch(err) {
       console.log(err)
    }
}

exports.findBooks = async(req, res, next) => {
   
   var page = req.params.page || 1;
   const filter = req.body.filter.toLowerCase();
   const value = req.body.searchName;

   if(value == "") {
       req.flash("error", "Search field is empty. Please fill the search field in order to get a result");
       return res.redirect('back');
   }

   const searchObj = {};
   searchObj[filter] = value;

   try {
      const books = await Book
      .find(searchObj)
      .skip((PER_PAGE * page) - PER_PAGE)
      .limit(PER_PAGE)

      const count = await Book.find(searchObj).countDocuments();

      res.render("books", {
         books: books,
         current: page,
         pages: Math.ceil(count / PER_PAGE),
         filter: filter,
         value: value,
         user: req.user,
      })
   } catch(err) {
      console.log(err)
   }
}
 
exports.getBookDetails = async(req, res, next) => {
   try {
      const book_id = req.params.book_id;
      const book = await Book.findById(book_id).populate("comments");
      res.render("user/bookDetails", {book: book});
   } catch (err) {
      console.log(err);
      return res.redirect("back");
   }
}
