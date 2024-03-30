exports.sendError = (res, statusCode, status, errorMessage) => {
    res.status(statusCode).json({
        status: status,
        message: errorMessage,
    })
}

