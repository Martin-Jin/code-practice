cmake_minimum_required(VERSION 3.16)
project(MECHENG270Practice CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS ON)

# Developer option: compile the reference solutions instead of your answers
# (used to check that every test is satisfiable).
option(USE_SOLUTIONS "Build with the reference solutions" OFF)

file(GLOB QUESTION_SOURCES CONFIGURE_DEPENDS
     ${CMAKE_SOURCE_DIR}/questions/*.cpp
     ${CMAKE_SOURCE_DIR}/extra_questions/questions/*.cpp)

add_executable(practice main.cpp framework/test_framework.cpp ${QUESTION_SOURCES})
target_include_directories(practice PRIVATE ${CMAKE_SOURCE_DIR})
if(USE_SOLUTIONS)
  target_compile_definitions(practice PRIVATE USE_SOLUTIONS)
endif()
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
  target_compile_options(practice PRIVATE -Wall -Wextra -Wno-unused-parameter)
endif()
