const sharp = require('sharp');
const uid = require('uid');
const fs = require('fs');

const User = require("../models/user"),
      Activity = require("../models/activity"),
      Book = require("../models/book"),
      Issue = require("../models/issue"),
      Comment = require("../models/comment");

const deleteImage = require('../utils/delete_image');

const PER_PAGE = 5;

exports.getUserDashboard = async(req, res, next) => {
    var page = req.params.page || 1;
    const user_id = req. user._id;

    try {
        const user = await User.findById(user_id);

        if(user.bookIssueInfo.length > 0) {
            const issues = await Issue.find({"user_id.id" : user._id});

            for(let issue of issues) {
                if(issue.book_info.returnDate < Date.now()) {
                    user.violatonFlag = true;
                    user.save();
                    req.flash("warning", "You are flagged for not returning " + issue.book_info.title + " in time");
                    break;
                }
            }
        }
        const activities = await Activity
            .find({"user_id.id": req.user._id})
            .sort({_id: -1})
            .skip((PER_PAGE * page) - PER_PAGE)
            .limit(PER_PAGE);

        const activity_count = await Activity.find({"user_id.id": req.user._id}).countDocuments();

        res.render("user/index", {
					user : user,
					current : page,
					pages: Math.ceil(activity_count / PER_PAGE),
					activities : activities,
        });
    } catch(err) {
			console.log(err);
			return res.redirect('back');
    }
}

exports.getUserProfile = (req, res, next) => {
    res.render("user/profile");
}
 
exports.putUpdatePassword = async(req, res, next) => {
    const username = req.user.username;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.password;

    try {
        const user = await User.findByUsername(username);
        await user.changePassword(oldPassword, newPassword);
        await user.save();

        const activity = new Activity({
            category: "Update Password",
            user_id : {
                id : req.user._id,
                username : req.user.username,
            },
        });
        await activity.save();

        req.flash("success", "Your password is recently updated. Please log in again to confirm");
        res.redirect("/auth/user-login");
    } catch(err) {
        console.log(err);
        return res.redirect('back');
    }
}

exports.putUpdateUserProfile = async(req, res, next) => {
    try{
        const userUpdateInfo = {
            "firstName": req.body.firstName,
            "lastName": req.body.lastName,
            "email": req.body.email,
            "gender": req.body.gender,
            "address": req.body.address,
        }
        await User.findByIdAndUpdate(req.user._id, userUpdateInfo);

        const activity = new Activity({
            category: "Update Profile",
            user_id: {
                id: req.user._id,
                username: req.user.username,
            }
        });
        await activity.save();

        res.redirect('back');
    } catch(err) {
        console.log(err);
        return res.redirect('back');
    }
}

exports.postUploadUserImage = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const user = await User.findById(user_id);

        let imageUrl;
        if(req.file) {
            imageUrl = `${uid()}__${req.file.originalname}`;
            let filename = `images/${imageUrl}`;
            let previousImagePath = `images/${user.image}`;

            const imageExist = fs.existsSync(previousImagePath);
            if(imageExist) {
                deleteImage(previousImagePath);
            }
            await sharp(req.file.path)
                .rotate()
                .resize(500, 500)
                .toFile(filename);
            
            fs.unlink(req.file.path, (err) => {
                if(err) {
                    console.log(err);
                }
            })
        } else {
            imageUrl = 'profile.png';
        }
        
        user.image = imageUrl;
        await user.save();
        
        const activity = new Activity({
            category : "Upload Photo",
            user_id : {
              id : req.user._id,
              username: user.username,
             }
        });
        await activity.save();
        
        res.redirect("/user/1/profile");
    } catch(err) {
        console.log(err);
        res.redirect('back');
    }
};

exports.getNotification = async(req, res, next) => {
    res.render("user/notification");
}

exports.postIssueBook = async(req, res, next) => {
    if(req.user.violationFlag) {
        req.flash("error", "You are flagged for violating rules/delay on returning books/paying fines. Untill the flag is lifted, You can't issue any books");
        return res.redirect("back");
    }

    if(req.user.bookIssueInfo.length >= 5) {
        req.flash("warning", "You can't issue more than 5 books at a time");
        return res.redirect("back");
    }

    try {
        const book = await Book.findById(req.params.book_id);
        const user = await User.findById(req.params.user_id);

        book.stock -= 1;
        const issue =  new Issue({
            book_info: {
                id: book._id,
                title: book.title,
                author: book.author,
                ISBN: book.ISBN,
                category: book.category,
                stock: book.stock,
            },
            user_id: {
                id: user._id,
                username: user.username,
            }
        });

        user.bookIssueInfo.push(book._id);

        const activity = new Activity({
            info: {
                id: book._id,
                title: book.title,
            },
            category: "Issue",
            time: {
                id: issue._id,
                issueDate: issue.book_info.issueDate,
                returnDate: issue.book_info.returnDate,
            },
            user_id: {
                id: user._id,
                username: user.username,
            }
        });

        await issue.save();
        await user.save();
        await book.save();
        await activity.save();

        res.redirect("/books/all/all/1");
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }
}

exports.getShowRenewReturn = async(req, res, next) => {
    const user_id = req.user._id;
    try {
        const issue = await Issue.find({"user_id.id": user_id});
        res.render("user/return-renew", {user: issue});
    } catch (err) {
        console.log(err);
        return res.redirect("back");
    }
}

exports.postRenewBook = async(req, res, next) => {
    try {
        const searchObj = {
            "user_id.id": req.user._id,
            "book_info.id": req.params.book_id,
        }
        const issue = await Issue.findOne(searchObj);
        let time = issue.book_info.returnDate.getTime();
        issue.book_info.returnDate = time + 7*24*60*60*1000;
        issue.book_info.isRenewed = true;

        const activity = new Activity({
            info: {
                id: issue._id,
                title: issue.book_info.title,
            },
            category: "Renew",
            time: {
                id: issue._id,
                issueDate: issue.book_info.issueDate,
                returnDate: issue.book_info.returnDate,
            },
            user_id: {
                id: req.user._id,
                username: req.user.username,
            }
        });

        await activity.save();
        await issue.save();

        res.redirect("/books/return-renew");
    } catch (err) {
        console.log(err);
        return res.redirect("back");
        
    }
}

exports.postReturnBook = async(req, res, next) => {
    try {
        const book_id = req.params.book_id;
        const pos = req.user.bookIssueInfo.indexOf(req.params.book_id);
        
        const book = await Book.findById(book_id);
        book.stock += 1;
        await book.save();

        const issue =  await Issue.findOne({"user_id.id": req.user._id});
        await issue.remove();

        req.user.bookIssueInfo.splice(pos, 1);
        await req.user.save();

        const activity = new Activity({
            info: {
                id: issue.book_info.id,
                title: issue.book_info.title,
            },
            category: "Return",
            time: {
                id: issue._id,
                issueDate: issue.book_info.issueDate,
                returnDate: issue.book_info.returnDate,
            },
            user_id: {
                id: req.user._id,
                username: req.user.username,
            }
        });
        await activity.save();

        res.redirect("/books/return-renew");
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }
}

exports.postNewComment = async(req, res, next) => {
    try {
        const comment_text = req.body.comment;
        const user_id = req.user._id;
        const username = req.user.username;

        const book_id = req.params.book_id;
        const book = await Book.findById(book_id);

        const comment = new Comment({
            text: comment_text,
            author: {
                id: user_id,
                username: username,
            },
            book: {
                id: book._id,
                title: book.title,
            }
        });
        await comment.save();
        
        book.comments.push(comment._id);
        await book.save();

        const activity = new Activity({
            info: {
                id: book._id,
                title: book.title,
            },
            category: "Comment",
            user_id: {
                id: user_id,
                username: username,
            }
        });
        await activity.save();

        res.redirect("/books/details/"+book_id);
    } catch (err) {
        console.log(err);
        return res.redirect("back");
        
    }
}

exports.postUpdateComment = async(req, res, next) => {
    const comment_id = req.params.comment_id;
    const comment_text = req.body.comment;
    const book_id = req.params.book_id;
    const username = req.user.username;
    const user_id = req.user._id;

    try {
        await Comment.findByIdAndUpdate(comment_id, comment_text);

        const book = await Book.findById(book_id);

        const activity = new Activity({
            info: {
                id: book._id,
                title: book.title,
             },
             category: "Update Comment",
             user_id: {
                id: user_id,
                username: username,
             }
        });
        await activity.save();

        res.redirect("/books/details/"+book_id);
        
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }

}

exports.deleteComment = async(req, res, next) => {
    const book_id = req.params.book_id;
    const comment_id = req.params.comment_id;
    const user_id = req.user._id;
    const username = req.user.username;
    try {
        const book = await Book.findById(book_id);

        const pos = book.comments.indexOf(comment_id);
        book.comments.splice(pos, 1);
        await book.save();

        await Comment.findByIdAndRemove(comment_id);

        const activity = new Activity({
            info: {
                id: book._id,
                title: book.title,
             },
            category: "Delete Comment",
            user_id: {
                id: user_id,
                username: username,
             }
        });
        await activity.save();

        res.redirect("/books/details/" + book_id);
    } catch(err) {
        console.log(err);
        return res.redirect("back");
    }
}

exports.deleteUserAccount = async (req, res, next) => {
    try {
        const user_id = req.user._id;

        const user = await User.findById(user_id);
        await user.remove();

        let imagePath = `images/${user.image}`;
        if(fs.existsSync(imagePath)) {
            deleteImage(imagePath);
        }

        await Issue.deleteMany({"user_id.id": user_id});
        await Comment.deleteMany({"author.id":user_id});
        await Activity.deleteMany({"user_id.id": user_id});

        res.redirect("/");
    } catch (err) {
        console.log(err);
        res.redirect('back');
    }
}

