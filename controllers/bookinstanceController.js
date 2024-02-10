const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

//Display list of all book instances
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate("book").exec();

    res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: allBookInstances
    });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id).populate("book").exec();

    // No results.
    if (bookInstance === null) {
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
    }

    res.render("bookinstance_detail", {
        title: "Book",
        bookinstance: bookInstance
    });
});


// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();
    res.render("bookinstance_form", {
        title: "Create book instance",
        book_list: allBooks,
        selected_book: undefined,
        bookinstance: undefined,
        errors: undefined
    });
});


// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // Validate and sanitize fields.
    body("book", "Book must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("imprint", "Imprint must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            due_back: req.body.due_back,
            status: req.body.status
        });

        if (!errors.isEmpty()) {
            // There are errors.
            // Render form again with sanitized values and error messages.

            const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();
            res.render("bookinstance_form", {
                title: "Create book instance",
                book_list: allBooks,
                errors: errors.array(),
                bookinstance: bookInstance,
                selected_book: bookInstance.book._id
            });
            return;
        } else {
            // Data from form is valid

            await bookInstance.save();
            res.redirect(bookInstance.url);
        }
    })
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    const bookinstance = await BookInstance.findById(req.params.id).populate("book");

    if (bookinstance === null) {
        // No results.
        res.redirect("/catalog/bookinstances");
    }


    res.render("bookinstance_delete", {
        title: "Delete Copy",
        copy: bookinstance
    });
});


// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    await BookInstance.findByIdAndDelete(req.body.copyid);
    res.redirect("/catalog/bookinstances");
});


// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    const [bookInstance, allBooks] = await Promise.all([
        BookInstance.findById(req.params.id).exec(),
        Book.find({}, "title").sort({ title: 1 }).exec()
    ]);

    if (bookInstance === null) {
        // No results.
        const err = new Error("Book instance not found");
        err.status = 404;
        return next(err);
    }

    res.render("bookinstance_form", {
        title: "Update Book instance",
        bookinstance: bookInstance,
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: undefined
    });
});


// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // Validate and sanitize fields.
    body("book", "Book must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("imprint", "Imprint must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data and old id
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            due_back: req.body.due_back,
            status: req.body.status,
            _id: req.params.id  // This is required, or a new ID will be assigned!
        });

        if (!errors.isEmpty()) {
            // There are errors.
            // Render form again with sanitized values and error messages.

            const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();
            res.render("bookinstance_form", {
                title: "Create book instance",
                book_list: allBooks,
                errors: errors.array(),
                bookinstance: bookInstance,
                selected_book: bookInstance.book._id
            });
            return;
        } else {
            // Data from form is valid. Update the record.

            const updatedBookInstance = await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
            res.redirect(updatedBookInstance.url);
        }
    })
];

