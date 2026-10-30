package com.corehub.backend.repository;

import com.corehub.backend.entity.SystemLock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemLockRepository extends JpaRepository<SystemLock, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SystemLock s WHERE s.lockKey = :lockKey")
    Optional<SystemLock> findByLockKeyWithLock(@Param("lockKey") String lockKey);
}
