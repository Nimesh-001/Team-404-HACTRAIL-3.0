package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.JobPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobPostRepository extends JpaRepository<JobPost, Long> {
    List<JobPost> findAllByOrderByCreatedAtDesc();
    List<JobPost> findByPostedByIdOrderByCreatedAtDesc(Long postedById);
}
