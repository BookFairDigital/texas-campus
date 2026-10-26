create unique index course_package_orders_one_pending_per_student
  on public.course_package_orders (student_id, package_slug)
  where payment_status = 'pending';