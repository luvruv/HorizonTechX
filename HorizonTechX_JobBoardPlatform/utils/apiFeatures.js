/**
 * Small, reusable query-builder for Mongoose find() chains driven by
 * req.query. Keeps job search/filter/sort/pagination logic out of the
 * controllers and in one testable, reusable place.
 *
 * Usage:
 *   const features = new ApiFeatures(JobListing.find(), req.query)
 *     .search(['title', 'description'])
 *     .filter()
 *     .sort()
 *     .paginate();
 *   const results = await features.query;
 */
class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // Keyword search across a text index (title/description/skills).
  search() {
    if (this.queryString.keyword) {
      this.query = this.query.find({ $text: { $search: this.queryString.keyword } });
    }
    return this;
  }

  // Structured filters: location, jobType, category, experienceLevel,
  // skills (comma separated), salary range, status.
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['keyword', 'sort', 'page', 'limit', 'fields'];
    excludedFields.forEach((field) => delete queryObj[field]);

    const filters = {};

    if (queryObj.location) {
      filters.location = { $regex: queryObj.location, $options: 'i' };
    }
    if (queryObj.jobType) {
      filters.jobType = queryObj.jobType;
    }
    if (queryObj.category) {
      filters.category = { $regex: queryObj.category, $options: 'i' };
    }
    if (queryObj.experienceLevel) {
      filters.experienceLevel = queryObj.experienceLevel;
    }
    if (queryObj.status) {
      filters.status = queryObj.status;
    }
    if (queryObj.isRemote) {
      filters.isRemote = queryObj.isRemote === 'true';
    }
    if (queryObj.skills) {
      const skillsArray = queryObj.skills.split(',').map((s) => s.trim().toLowerCase());
      filters.skillsRequired = { $in: skillsArray };
    }
    if (queryObj.salaryMin || queryObj.salaryMax) {
      filters.salaryMin = {};
      if (queryObj.salaryMin) filters.salaryMin = { ...filters.salaryMin, $gte: Number(queryObj.salaryMin) };
    }
    if (queryObj.salaryMax) {
      filters.salaryMax = { $lte: Number(queryObj.salaryMax) };
    }
    if (queryObj.employer) {
      filters.employer = queryObj.employer;
    }

    this.query = this.query.find(filters);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit };
    return this;
  }
}

module.exports = ApiFeatures;
