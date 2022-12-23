const express = require("express"),
      router = express.Router(),
      middleware = require("../middleware");

const userController = require('../controllers/user');

router.get("/user/:page", middleware.isLoggedIn, userController.getUserDashboard);

router.get("/user/:page/profile", middleware.isLoggedIn, userController.getUserProfile);

router.post("/user/1/image", middleware.isLoggedIn, userController.postUploadUserImage);

router.put("/user/1/update-password", middleware.isLoggedIn, userController.putUpdatePassword);

router.put("/user/1/update-profile", middleware.isLoggedIn, userController.putUpdateUserProfile);

router.get("/user/1/notification", middleware.isLoggedIn, userController.getNotification);

router.post("/books/:book_id/issue/:user_id", middleware.isLoggedIn, userController.postIssueBook);

router.get("/books/return-renew", middleware.isLoggedIn, userController.getShowRenewReturn);

router.post("/books/:book_id/renew", middleware.isLoggedIn, middleware.isLoggedIn, userController.postRenewBook);

router.post("/books/:book_id/return", middleware.isLoggedIn, userController.postReturnBook);

router.post("/books/details/:book_id/comment", middleware.isLoggedIn, userController.postNewComment);

router.post("/books/details/:book_id/:comment_id", middleware.isLoggedIn, userController.postUpdateComment);

router.delete("/books/details/:book_id/:comment_id", middleware.isLoggedIn, userController.deleteComment);

router.delete("/user/1/delete-profile", middleware.isLoggedIn, userController.deleteUserAccount);

module.exports = router;