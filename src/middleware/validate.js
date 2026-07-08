//Validate application/json data
const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    try {
      // console.log("req.body: ",req.body);
      let data = req[source];

      const { error, value } = schema.validate(data, {
        abortEarly: false,
        errors: {
          wrap: {
            label: false, // removes quotes from field names
          },
        },
      });

      if (error) {
        const errors = error.details.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors,
        });
      }

      // assign parsed + validated data back
      req[source] = value;

      next();
    } catch (err) {
      return res.status(500).json({ error: "Validation middleware error" });
    }
  };

module.exports = { validate };