export abstract class PaginatedViewDto<T> {
  abstract items: T;
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;

  public static mapToView<T>(data: {
    items: T;
    page: number;
    size: number;
    totalCount: number;
  }): PaginatedViewDto<T> {
    return {
      pagesCount: Math.ceil(data.totalCount / data.size),
      page: data.page,
      pageSize: data.size,
      totalCount: data.totalCount,
      items: data.items,
    };
  }
}
