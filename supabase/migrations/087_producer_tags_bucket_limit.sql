-- Increase producer-tags bucket limit from 5MB to 10MB
update storage.buckets
set file_size_limit = 10485760
where id = 'producer-tags';
