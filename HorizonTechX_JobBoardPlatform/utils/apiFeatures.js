const mongoose = require('mongoose');

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
  // skills (comma separated), salary range, status, datePosted, etc.
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['keyword', 'sort', 'page', 'limit', 'fields', 'company', 'datePosted'];
    excludedFields.forEach((field) => delete queryObj[field]);

    const filters = {};

    if (queryObj.location) {
      filters.location = { $regex: queryObj.location, $options: 'i' };
    }

    // Support comma-separated jobType filters (e.g. jobType=full-time,remote)
    if (queryObj.jobType) {
      const types = queryObj.jobType.split(',').map((t) => t.trim().toLowerCase());
      filters.jobType = { $in: types };
    }

    if (queryObj.category) {
      filters.category = { $regex: queryObj.category, $options: 'i' };
    }

    // Support comma-separated experienceLevel filters (e.g. experienceLevel=entry,mid)
    if (queryObj.experienceLevel) {
      const levels = queryObj.experienceLevel.split(',').map((l) => l.trim().toLowerCase());
      filters.experienceLevel = { $in: levels };
    } else if (queryObj.experience) {
      const levels = queryObj.experience.split(',').map((l) => l.trim().toLowerCase());
      filters.experienceLevel = { $in: levels };
    }

    if (queryObj.status) {
      filters.status = queryObj.status;
    }

    if (queryObj.isRemote) {
      filters.isRemote = queryObj.isRemote === 'true';
    }

    // Skills: matching either of specified skills (comma-separated list)
    if (queryObj.skills) {
      const skillsArray = queryObj.skills.split(',').map((s) => s.trim().toLowerCase());
      filters.skillsRequired = { $in: skillsArray };
    }

    // Overlapping Salary Matching Strategy
    // salaryMin: minimum acceptable salary. The job's maximum salary must be >= query's min salary.
    // salaryMax: maximum query salary. The job's minimum salary must be <= query's max salary.
    if (queryObj.salaryMin || queryObj.salaryMax) {
      filters.$and = filters.$and || [];
      if (queryObj.salaryMin) {
        filters.$and.push({ salaryMax: { $gte: Number(queryObj.salaryMin) } });
      }
      if (queryObj.salaryMax) {
        filters.$and.push({ salaryMin: { $lte: Number(queryObj.salaryMax) } });
      }
    }

    // Safe ObjectId cast for employer parameter to prevent casting error crashes
    if (queryObj.employer) {
      if (mongoose.Types.ObjectId.isValid(queryObj.employer)) {
        filters.employer = new mongoose.Types.ObjectId(queryObj.employer);
      } else {
        // If queryObj.employer is invalid, ensure the query yields empty results safely
        filters.employer = new mongoose.Types.ObjectId();
      }
    }

    // Date Posted Filter (e.g. datePosted=1 for past 24h, datePosted=7 for past 7 days, datePosted=30 for 30 days)
    if (this.queryString.datePosted) {
      const days = parseInt(this.queryString.datePosted, 10);
      if (!isNaN(days) && days > 0) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        filters.createdAt = { $gte: cutoff };
      }
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
