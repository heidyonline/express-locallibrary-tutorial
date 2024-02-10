const Author = require("../models/author");
const asyncHandler = require("express-async-handler");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

//Display list of all authors
exports.author_list = asyncHandler(async (req, res, next) => {
    const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
    res.render("author_list", {
        title: "Author List",
        author_list: allAuthors
    });
});

//Display detail page for a specific author
exports.author_detail = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec()
    ]);

    // No results.
    if (author === null) {
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
    }

    res.render("author_detail", {
        title: "Author Detail",
        author: author,
        author_books: allBooksByAuthor
    });
});

//Display author create form on GET
exports.author_create_get = (req, res, next) => {
    res.render("author_form", {
        title: "Create Author",
        author: undefined,
        errors: undefined
    });
};

//Handle author create on POST
exports.author_create_post = [
    // Validate and sanitize the fields.
    body("first_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("First Name must be specified")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters"),
    body("family_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("Family Name must be specified")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters"),
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),


    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render("author_form", {
                title: "Create Author",
                author: author,
                errors: errors.array()
            });
            return;

        } else {
            // Data from form is valid.
            // Save author.
            await author.save();
            // Redirect to new author record.
            res.redirect(author.url);
        }
    })
];

//Display author delete on GET
exports.author_delete_get = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec()
    ]);
    if (author === null) {
        // No results.

        res.redirect("/catalog/authors");
    }
    res.render("author_delete", {
        title: "Delete Author",
        author: author,
        author_books: allBooksByAuthor
    });
});

//Handle author delete on POST
exports.author_delete_post = asyncHandler(async (req, res, next) => {
    // Get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec()
    ]);

    if (allBooksByAuthor.length > 0) {
        // Author has books. Render in same way as for GET route.
        res.render("author_delete", {
            title: "Delete Author",
            author: author,
            author_books: allBooksByAuthor
        });
        return;
    } else {
        // Author has no books. Delete object and redirect to the list of authors.
        await Author.findByIdAndDelete(req.body.authorid);
        res.redirect("/catalog/authors");
    }
});

//Display author update on GET
exports.author_update_get = asyncHandler(async (req, res, next) => {
    const author = await Author.findById(req.params.id).exec();

    if (author === null) {
        //No author found
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
    }

    res.render("author_form", {
        title: "Update Author",
        author: author,
        errors: undefined
    });
});

//Handle author update on POST
exports.author_update_post = [
    // Validate and sanitize the fields.
    body("first_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("First Name must be specified")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters"),
    body("family_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("Family Name must be specified")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters"),
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),


    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data and old id
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id  // This is required, or a new ID will be assigned!
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render("author_form", {
                title: "Update Author",
                author: author,
                errors: errors.array()
            });
            return;

        } else {
            // Data from form is valid. Update the record
            const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});
            // Redirect to updated author record.
            res.redirect(updatedAuthor.url);
        }
    })
];