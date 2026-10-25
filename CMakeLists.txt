cmake_minimum_required(VERSION 3.16)
project(CodePracticeQuestions CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS ON)

# Which question set under sets/ to build (every .cpp inside it is a question).
set(SET_NAME "mecheng270" CACHE STRING "Question set under sets/")

# Developer option: compile the reference solutions instead of your answers
# (used to check that every test is satisfiable).
option(USE_SOLUTIONS "Build with the reference solutions" OFF)

# Developer option: run every question (CI, per-change check) instead of the one
# chosen by kQuestion in main.cpp.
option(RUN_ALL "Run every question instead of the one chosen in main.cpp" OFF)
if(RUN_ALL)
  set(MAIN_SOURCE framework/run_all_main.cpp)
else()
  set(MAIN_SOURCE main.cpp)
endif()

file(GLOB_RECURSE QUESTION_SOURCES CONFIGURE_DEPENDS
     ${CMAKE_SOURCE_DIR}/sets/${SET_NAME}/*.cpp)

add_executable(practice ${MAIN_SOURCE} framework/test_framework.cpp ${QUESTION_SOURCES})
target_include_directories(practice PRIVATE ${CMAKE_SOURCE_DIR})
if(USE_SOLUTIONS)
  target_compile_definitions(practice PRIVATE USE_SOLUTIONS)
endif()
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
  target_compile_options(practice PRIVATE -Wall -Wextra -Wno-unused-parameter)
endif()
