package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.UniversityBankDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UniversityBankDetailsRepository extends JpaRepository<UniversityBankDetails, Long> {
}
